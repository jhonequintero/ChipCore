from flask import Flask, request, redirect, session, url_for, render_template, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import re
import random
import threading

# Librerías para PDF y correo
import pdfkit
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from email.mime.text import MIMEText


app = Flask(__name__)
app.secret_key = 'Clave_JhoneiderQuintero_chipcore_2023'
# config = pdfkit.configuration(wkhtmltopdf=r'C:\Users\JHONEYDER QUINTERO\OneDrive - SENA\Documentos\Escritorio\wkhtmltopdf\bin\wkhtmltopdf.exe')


app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://chipcore_user:QJ4oZIaYL90TkcEsX2OewT7eFunk4REv@dpg-d0l3el7fte5s73962vmg-a.oregon-postgres.render.com:5432/base_datos_chipcore"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Usuario(db.Model):
    __tablename__ = 'usuario'
    codigo = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, unique=True, nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=False)
    correo = db.Column(db.String(100), unique=True, nullable=False)
    contrasena = db.Column(db.String(200), nullable=False)
    rol = db.Column(db.String(20), nullable=False)
    estado = db.Column(db.Boolean, default=True)
    codigo_empleado = db.Column(db.String(10), unique=True)


class Producto(db.Model):
    __tablename__ = 'producto'
    id_producto = db.Column(db.Integer, primary_key=True)
    nombre_producto = db.Column(db.String(100), nullable=False)
    descripcion_producto = db.Column(db.String(200), nullable=True)
    precio_producto = db.Column(db.Float, nullable=False)
    cantidad_producto = db.Column(db.Integer, nullable=False)


class Cliente(db.Model):
    __tablename__ = 'cliente'
    id_cliente = db.Column(db.Integer, primary_key=True)
    nombre_completo = db.Column(db.String(200), nullable=False)
    correo = db.Column(db.String(100), unique=True, nullable=False)
    cedula = db.Column(db.String(11), unique=True, nullable=False)


class Carrito(db.Model):
    __tablename__ = 'carrito'
    id_carrito = db.Column(db.Integer, primary_key=True)
    id_cliente = db.Column(db.Integer, db.ForeignKey('cliente.id_cliente'), nullable=False)
    id_producto = db.Column(db.Integer, db.ForeignKey('producto.id_producto'), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    fecha = db.Column(db.DateTime, default=db.func.current_timestamp())

class VentaCabecera(db.Model):
    __tablename__ = 'venta_cabecera'
    id_venta = db.Column(db.Integer, primary_key=True)
    id_cliente = db.Column(db.Integer, db.ForeignKey('cliente.id_cliente'))
    id_vendedor = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'))
    fecha = db.Column(db.Date)
    hora = db.Column(db.Time)
    folio = db.Column(db.String)
    total = db.Column(db.Float)

    cliente = db.relationship('Cliente', backref='ventas')
    vendedor = db.relationship('Usuario', backref='ventas')


class VentaDetalle(db.Model):
    __tablename__ = 'venta_detalle'
    id_detalle = db.Column(db.Integer, primary_key=True)
    id_venta = db.Column(db.Integer, db.ForeignKey('venta_cabecera.id_venta'))
    id_producto = db.Column(db.Integer, db.ForeignKey('producto.id_producto'))
    cantidad = db.Column(db.Integer)
    precio = db.Column(db.Float) # Este es el precio unitario del producto en el momento de la venta

    venta = db.relationship('VentaCabecera', backref='detalles')
    producto = db.relationship('Producto')


with app.app_context():
    db.create_all()

    admins = [
        {'id_usuario': 1001, 'nombre': 'Angel', 'apellido': 'Orihuela Beltran', 'correo': 'angelorihuela72@gmail.com', 'contrasena': 'Angel123'},
        {'id_usuario': 1002, 'nombre': 'Jhoneider', 'apellido': 'Quintero Rodriguez', 'correo': 'jhoneiderrodriguez6@gmail.com', 'contrasena': 'Jhoneider1234'},
        {'id_usuario': 1003, 'nombre': 'Cristian', 'apellido': 'Ferrer Ortega', 'correo': 'admin3@correo.com', 'contrasena': 'Cristian12345'},
        {'id_usuario': 1004, 'nombre': 'NONE', 'apellido': 'NONE', 'correo': 'admin4@correo.com', 'contrasena': 'Administrador123456'},
    ]

    for adm in admins:
        if not Usuario.query.filter_by(correo=adm['correo']).first():
            nuevo_admin = Usuario(
                id_usuario=adm['id_usuario'],
                nombre=adm['nombre'],
                apellido=adm['apellido'],
                correo=adm['correo'],
                contrasena=generate_password_hash(adm['contrasena']),
                rol='administrador',
                estado=True
            )
            db.session.add(nuevo_admin)
    db.session.commit()

@app.route('/')
def inicio():
    return render_template('index.html', error=None)

@app.route('/login', methods=['POST'])
def login():
    # Soporta tanto JSON como form data (por si se prueba con formulario tradicional)
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form

    correo = data.get('correo', '').strip()
    contrasena = data.get('contrasena', '').strip()

    if not correo or not contrasena:
        return jsonify(success=False, error="Correo y contraseña son requeridos", campo="ambos")

    usuario = Usuario.query.filter_by(correo=correo).first()

    if usuario and usuario.estado:
        if check_password_hash(usuario.contrasena, contrasena):
            session['usuario'] = usuario.correo
            session['tipo'] = usuario.rol
            session['id_usuario'] = usuario.id_usuario

            if usuario.rol == 'administrador':
                return jsonify(success=True, redirect=url_for('panel_admin'))
            elif usuario.rol == 'empleado':
                return jsonify(success=True, redirect=url_for('panel_trabajador'))
            else:
                # Si hay otros roles, redirigir aquí o devolver error
                return jsonify(success=False, error="Rol de usuario no reconocido", campo="ambos")
        else:
            return jsonify(success=False, error="Contraseña incorrecta", campo="contrasena")

    return jsonify(success=False, error="Correo o contraseña incorrectos", campo="ambos")

@app.route('/panel_admin')
def panel_admin():
    if 'usuario' in session and session.get('tipo') == 'administrador':
        usuario = Usuario.query.filter_by(correo=session['usuario']).first()

        datos = {
            "id": usuario.id_usuario,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo,
            "rol": usuario.rol,
            "codigo_empleado": usuario.codigo_empleado
        }

        empleados = Usuario.query.filter_by(rol='empleado').all()
        productos = Producto.query.all()
        facturas = VentaCabecera.query.all() # Para el panel de admin, si necesita ver todas las facturas

        return render_template(
            'panel_admin.html',
            datos=datos,
            usuarios=empleados,
            productos=productos,
            facturas=facturas
        )

    return redirect(url_for('inicio'))

@app.route('/registrar_empleado', methods=['POST'])
def registrar_empleado():
    # Solo administradores pueden registrar empleados
    if 'usuario' in session and session.get('tipo') == 'administrador':
        cedula = request.form.get('id_usuario', '').strip()
        nombre = request.form.get('nombre', '').strip()
        apellido = request.form.get('apellido', '').strip()
        correo = request.form.get('correo', '').strip()
        contrasena = request.form.get('contrasena', '').strip()

        if not cedula or not nombre or not apellido or not correo or not contrasena:
            return jsonify(success=False, error="Todos los campos son requeridos.")

        if not cedula.isdigit():
            return jsonify(success=False, error="La cédula debe ser numérica.")

        if Usuario.query.filter_by(id_usuario=cedula).first():
            return jsonify(success=False, error="Ya existe un usuario con esa cédula.")

        if Usuario.query.filter_by(correo=correo).first():
            return jsonify(success=False, error="El correo ya está registrado.")

        # Obtener el último número del codigo_empleado correctamente
        from sqlalchemy import func, cast, Integer

        ultimo_num = db.session.query(
            func.max(
                cast(func.substring(Usuario.codigo_empleado, 4), Integer)
            )
        ).filter(Usuario.rol == 'empleado').scalar()

        if ultimo_num is None:
            nuevo_num = 1
        else:
            nuevo_num = ultimo_num + 1

        nuevo_codigo = f"EMP{str(nuevo_num).zfill(3)}"

        nuevo_empleado = Usuario(
            id_usuario=int(cedula),
            nombre=nombre,
            apellido=apellido,
            correo=correo,
            contrasena=generate_password_hash(contrasena),
            rol='empleado',
            estado=True,
            codigo_empleado=nuevo_codigo
        )

        db.session.add(nuevo_empleado)
        db.session.commit()

        return jsonify(success=True, mensaje="Empleado registrado exitosamente.")

    return jsonify(success=False, error="Acceso no autorizado.")

@app.route('/panel_trabajador')
def panel_trabajador():
    # Acceso para empleados
    if 'usuario' in session and session.get('tipo') == 'empleado':
        usuario = Usuario.query.filter_by(correo=session['usuario']).first()
        if usuario:
            datos = {
                "id": usuario.id_usuario,
                "nombre": usuario.nombre,
                "apellido": usuario.apellido,
                "correo": usuario.correo,
                "rol": usuario.rol,
                "codigo_empleado": usuario.codigo_empleado
            }
            # Los productos y las ventas se pasan para que el trabajador pueda verlos
            productos = Producto.query.all()
            # Para el trabajador, solo se mostrarán sus propias ventas en el panel principal
            facturas = VentaCabecera.query.filter_by(id_vendedor=usuario.id_usuario).all()


            return render_template('panel_trabajador.html',
                                   datos=datos,
                                   productos=productos,
                                   facturas=facturas)
    return redirect(url_for('inicio'))


@app.route('/usuario/<int:id_usuario>/cambiar_estado', methods=['POST'])
def cambiar_estado_usuario(id_usuario):
    # Solo administradores pueden cambiar el estado de los usuarios
    if 'usuario' in session and session.get('tipo') == 'administrador':
        usuario = Usuario.query.filter_by(id_usuario=id_usuario).first()
        if not usuario:
            return jsonify({'success': False, 'msg': 'Usuario no encontrado'}), 404

        usuario.estado = not usuario.estado  # cambia el estado
        db.session.commit()
        return jsonify({'success': True, 'nuevo_estado': usuario.estado})
    return jsonify({'success': False, 'msg': 'Acceso no autorizado'}), 403


@app.route('/agregar_producto', methods=['POST'])
def agregar_producto():
    # Solo administradores pueden agregar productos
    if 'usuario' in session and session.get('tipo') == 'administrador':
        nombre = request.form['nombre_producto']
        descripcion = request.form['descripcion_producto']
        precio = float(request.form['precio_producto'])
        cantidad = int(request.form['cantidad_producto'])

        nuevo_producto = Producto(
            nombre_producto=nombre,
            descripcion_producto=descripcion,
            precio_producto=precio,
            cantidad_producto=cantidad
        )

        db.session.add(nuevo_producto)
        db.session.commit()

        return redirect(url_for('panel_admin'))
    return redirect(url_for('inicio'))


@app.route('/ver_productos')
def ver_productos():
    # Esta ruta es para que el administrador vea los productos.
    # Para el trabajador, se manejará directamente en su panel.
    if 'usuario' in session and session.get('tipo') == 'administrador':
        usuario = Usuario.query.filter_by(correo=session['usuario']).first()
        productos = Producto.query.all()
        empleados = Usuario.query.filter_by(rol='empleado', estado=True).all()
        datos = {
            "id": usuario.id_usuario,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo,
            "rol": usuario.rol,
            "codigo_empleado": usuario.codigo_empleado
        }
        return render_template('panel_admin.html', datos=datos, vista='productos', productos=productos, usuarios=empleados)
    return redirect(url_for('inicio'))

# Nueva ruta para que el trabajador vea los productos (opcional, si quieres una vista dedicada)
# Si el trabajador solo los ve dentro de su panel principal, no es estrictamente necesaria.
# Sin embargo, si quieres que 'ver_productos' sea una acción específica para el trabajador, puedes usarla.
@app.route('/ver_productos_trabajador')
def ver_productos_trabajador():
    if 'usuario' in session and session.get('tipo') == 'empleado':
        usuario = Usuario.query.filter_by(correo=session['usuario']).first()
        productos = Producto.query.all()
        datos = {
            "id": usuario.id_usuario,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo,
            "rol": usuario.rol,
            "codigo_empleado": usuario.codigo_empleado
        }
        return render_template('panel_trabajador.html', datos=datos, vista='productos', productos=productos)
    return redirect(url_for('inicio'))


@app.route('/actualizar_producto', methods=['POST'])
def actualizar_producto():
    # Solo administradores pueden actualizar productos
    if 'usuario' in session and session.get('tipo') == 'administrador':
        id_producto = request.form.get('id_producto')
        nombre = request.form.get('nombre_producto')
        descripcion = request.form.get('descripcion_producto')
        cantidad = int(request.form.get('cantidad_producto', 0))
        precio = float(request.form.get('precio_producto', 0.0))

        producto = Producto.query.get(id_producto)
        if producto:
            producto.nombre_producto = nombre
            producto.descripcion_producto = descripcion
            producto.cantidad_producto = cantidad
            producto.precio_producto = precio
            db.session.commit()

        return redirect(url_for('panel_admin', vista='productos'))
    return jsonify({'success': False, 'msg': 'Acceso no autorizado'}), 403


@app.route('/verificar_producto', methods=['POST'])
def verificar_producto():
    # Permitir a administradores y empleados verificar productos
    if 'usuario' not in session or session.get('tipo') not in ['administrador', 'empleado']:
        return jsonify({"existe": False, "mensaje": "Acceso no autorizado"}), 401

    data = request.get_json()
    id_producto = data.get("id")
    cantidad = data.get("cantidad")

    producto = Producto.query.filter_by(id_producto=id_producto).first()

    if not producto:
        return jsonify({"existe": False, "mensaje": "Producto no encontrado"}), 404

    if cantidad > producto.cantidad_producto:
        return jsonify({
            "existe": True,
            "suficiente": False,
            "stock": producto.cantidad_producto,
            "mensaje": "Stock insuficiente"
        }), 200

    return jsonify({
        "existe": True,
        "suficiente": True,
        "producto": {
            "id": producto.id_producto,
            "nombre": producto.nombre_producto,
            "precio": producto.precio_producto,
            "cantidad": cantidad
        }
    }), 200

@app.route('/buscar_cliente', methods=['POST'])
def buscar_cliente():
    # Permitir a administradores y empleados buscar clientes (necesario para finalizar compra)
    if 'usuario' not in session or session.get('tipo') not in ['administrador', 'empleado']:
        return jsonify({"existe": False, "mensaje": "Acceso no autorizado"}), 401

    data = request.get_json()
    cedula = data.get("cedula")

    if not cedula:
        return jsonify({"existe": False}), 400

    cliente = Cliente.query.filter_by(cedula=cedula).first()
    if not cliente:
        return jsonify({"existe": False})

    return jsonify({
        "existe": True,
        "nombre": cliente.nombre_completo,
        "correo": cliente.correo
    })

@app.route('/finalizar_compra', methods=['POST'])
def finalizar_compra():
    # Permitir a administradores y empleados finalizar una compra
    if 'usuario' not in session or session.get('tipo') not in ['administrador', 'empleado']:
        return jsonify({"error": "Acceso no autorizado para finalizar compra"}), 403

    try:
        vendedor_id = session.get('id_usuario')
        print("ID del Vendedor (desde sesión):", vendedor_id)

        vendedor = Usuario.query.filter_by(id_usuario=vendedor_id).first()
        if not vendedor:
            print("Vendedor no encontrado con ID:", vendedor_id)
            return jsonify({"error": "Vendedor no válido"}), 400

        data = request.get_json()
        print("Datos recibidos:", data)

        cliente_data = data.get("cliente")
        carrito_data = data.get("carrito")

        if not cliente_data or not carrito_data:
            return jsonify({"mensaje": "Datos incompletos"}), 400

        cliente = Cliente.query.filter_by(cedula=cliente_data["cedula"]).first()
        if not cliente:
            cliente = Cliente(
                nombre_completo=cliente_data["nombre"],
                correo=cliente_data["correo"],
                cedula=cliente_data["cedula"]
            )
            db.session.add(cliente)
            db.session.commit() # Hacer commit del nuevo cliente si se añadió

        folio_venta = f"F{datetime.now().strftime('%Y%m%d%H%M%S')}{random.randint(100,999)}"
        fecha_actual = datetime.now().date()
        hora_actual = datetime.now().time()

        total_venta = 0
        detalles = []

        # Verificar stock antes de modificar
        for item in carrito_data:
            producto = Producto.query.get(item["id"])
            if not producto:
                return jsonify({"mensaje": f"Producto con ID {item['id']} no encontrado"}), 400

            cantidad_comprada = item["cantidad"]
            if producto.cantidad_producto < cantidad_comprada:
                return jsonify({
                    "mensaje": f"No hay suficiente stock del producto '{producto.nombre_producto}'. Stock disponible: {producto.cantidad_producto}"
                }), 400

            total_producto = cantidad_comprada * producto.precio_producto
            total_venta += total_producto

            detalles.append({
                "producto": producto,
                "cantidad": cantidad_comprada,
                "precio_unitario": producto.precio_producto,
                "total_producto": total_producto
            })

        # Crear la cabecera de la venta
        venta_cabecera = VentaCabecera(
            folio=folio_venta,
            fecha=fecha_actual,
            hora=hora_actual,
            id_cliente=cliente.id_cliente,
            id_vendedor=vendedor.id_usuario,
            total=total_venta
        )
        db.session.add(venta_cabecera)
        db.session.flush()  # Para obtener id_venta sin hacer commit aún

        # Crear detalles y descontar stock
        for detalle in detalles:
            producto = detalle["producto"]
            cantidad = detalle["cantidad"]
            precio_unitario = detalle["precio_unitario"]

            venta_detalle = VentaDetalle(
                id_venta=venta_cabecera.id_venta,
                id_producto=producto.id_producto,
                cantidad=cantidad,
                precio=precio_unitario
            )

            db.session.add(venta_detalle)

            producto.cantidad_producto -= cantidad  # descontar stock

        db.session.commit()

        # Preparar datos para la factura (nombre, cantidad, precio unitario)
        registros = [(d["producto"].nombre_producto, d["cantidad"], d["precio_unitario"]) for d in detalles]

        # Generar y enviar factura
        pdf_path = generar_pdf(cliente, registros, folio_venta, total_venta)

        # Aquí preparas el diccionario con los datos que necesitas para el correo
        venta_info = {
            "nombre_cliente": cliente.nombre_completo,
            "fecha": fecha_actual.strftime('%Y-%m-%d'),
            "hora": hora_actual.strftime('%H:%M:%S'),
            "folio": folio_venta,
            "total": total_venta,
            "vendedor": vendedor.nombre
        }

        # Llamas a la función que envía la factura de forma asíncrona (en otro hilo)
        enviar_factura_async(cliente.correo, pdf_path, venta_info)

        return jsonify({"mensaje": "✅ Compra finalizada, registro guardado y factura enviada al correo."})

    except Exception as e:
        db.session.rollback() # Hacer rollback en caso de error para prevenir commits parciales
        print("Error en /finalizar_compra:", e)
        return jsonify({"mensaje": "Error interno del servidor.", "detalle": str(e)}), 500

@app.route('/api/ventas')
def api_ventas():
    # Permitir a administradores y empleados ver los datos de ventas
    if 'usuario' not in session or session.get('tipo') not in ['administrador', 'empleado']:
        return jsonify({"error": "Acceso no autorizado para ver ventas"}), 403

    # Obtener el ID del usuario y su rol de la sesión
    user_id = session.get('id_usuario')
    user_rol = session.get('tipo')

    # Iniciar la consulta base
    query = db.session.query(
        VentaCabecera.fecha,
        VentaCabecera.hora,
        VentaCabecera.folio,
        Cliente.nombre_completo.label('nombre_cliente'),
        Cliente.cedula.label('cedula_cliente'),
        Producto.id_producto.label('codigo_producto'),
        Producto.nombre_producto.label('nombre_producto'),
        VentaDetalle.cantidad,
        VentaDetalle.precio.label('precio_unitario_detalle'), # Precio unitario de la venta
        (VentaDetalle.cantidad * VentaDetalle.precio).label('total_detalle_producto'), # Total por artículo de producto
        VentaCabecera.total.label('total_venta_cabecera'), # Total de la venta completa
        Usuario.nombre.label('vendedor')
    ) \
    .join(Cliente, VentaCabecera.id_cliente == Cliente.id_cliente) \
    .join(Usuario, VentaCabecera.id_vendedor == Usuario.id_usuario) \
    .join(VentaDetalle, VentaDetalle.id_venta == VentaCabecera.id_venta) \
    .join(Producto, VentaDetalle.id_producto == Producto.id_producto)

    # Si el usuario es un empleado, filtrar por sus propias ventas
    if user_rol == 'empleado':
        query = query.filter(VentaCabecera.id_vendedor == user_id)

    ventas = query.all()

    resultado = []
    for v in ventas:
        resultado.append({
            'fecha': v.fecha.strftime('%Y-%m-%d'),
            'hora': v.hora.strftime('%H:%M:%S'),
            'folio': v.folio,
            'nombre_cliente': v.nombre_cliente,
            'cedula_cliente': v.cedula_cliente,
            'codigo_producto': v.codigo_producto,
            'nombre_producto': v.nombre_producto,
            'cantidad': v.cantidad,
            'precio_unitario': float(v.precio_unitario_detalle),
            'total_detalle_producto': float(v.total_detalle_producto),
            'total_venta_completa': float(v.total_venta_cabecera),
            'vendedor': v.vendedor
        })

    return jsonify(resultado)


def enviar_factura(destinatario, archivo_pdf, venta_info):
    remitente = "marcelaquintero973@gmail.com"
    clave = "dzarsqoqqhxpqcub"
    asunto = "Factura de tu compra en Michochip"

    cuerpo_texto = f"""
    Hola {venta_info['nombre_cliente']},

    Gracias por tu compra en Michochip.

    Adjuntamos la factura correspondiente a tu pedido realizado el {venta_info['fecha']} a las {venta_info['hora']}.
    Número de factura (Folio): {venta_info['folio']}
    Total de la compra: ${venta_info['total']:.2f}
    Atendido por: {venta_info['vendedor']}

    Si tienes alguna duda o necesitas ayuda adicional, no dudes en contactarnos.

    ¡Gracias por preferirnos!

    Michochip - Soluciones tecnológicas
    """

    cuerpo_html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <p>Hola <strong>{venta_info['nombre_cliente']}</strong>,</p>
            <p>Gracias por tu compra en <strong>Michochip</strong>.</p>
            <p>Adjuntamos la factura correspondiente a tu pedido.</p>
            <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Fecha:</strong> {venta_info['fecha']}</li>
                <li><strong>Hora:</strong> {venta_info['hora']}</li>
                <li><strong>Folio:</strong> {venta_info['folio']}</li>
                <li><strong>Total:</strong> ${venta_info['total']:.2f}</li>
                <li><strong>Vendedor:</strong> {venta_info['vendedor']}</li>
            </ul>
            <p>Si tienes alguna duda o necesitas ayuda adicional, no dudes en contactarnos.</p>
            <br>
            <p>¡Gracias por preferirnos!</p>
            <p style="font-size: 0.9em; color: #888;">Michochip - Soluciones tecnológicas</p>
        </body>
    </html>
    """


    msg = MIMEMultipart("alternative")
    msg["From"] = "Microchip <marcelaquintero973@gmail.com>"
    msg["To"] = destinatario
    msg["Subject"] = asunto
    msg["Reply-To"] = remitente

    msg.attach(MIMEText(cuerpo_texto, "plain"))
    msg.attach(MIMEText(cuerpo_html, "html"))

    try:
        with open(archivo_pdf, "rb") as f:
            parte = MIMEApplication(f.read(), _subtype="pdf")
            parte.add_header("Content-Disposition", "attachment", filename=os.path.basename(archivo_pdf))
            msg.attach(parte)

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(remitente, clave)
        server.send_message(msg)
        server.quit()
        print(f"✅ Correo enviado a {destinatario}")
    except Exception as e:
        print("❌ Error al enviar correo:", e)

# Función para llamar enviar_factura en un hilo separado
def enviar_factura_async(destinatario, archivo_pdf, venta_info):
    hilo = threading.Thread(target=enviar_factura, args=(destinatario, archivo_pdf, venta_info))
    hilo.start()


def generar_pdf(cliente, compras, folio, total_venta):
    os.makedirs("facturas", exist_ok=True)

    html = f"""
    <h1>Factura - Folio {folio}</h1>
    <p>Cliente: {cliente.nombre_completo}</p>
    <p>Correo: {cliente.correo}</p>
    <p>Cédula: {cliente.cedula}</p>
    <hr>
    <table border="1" cellspacing="0" cellpadding="4">
        <tr><th>Producto</th><th>Cantidad</th><th>Precio Unitario</th><th>Total</th></tr>
    """
    for nombre, cantidad, precio_unitario in compras:
        total_producto = cantidad * precio_unitario
        html += f"<tr><td>{nombre}</td><td>{cantidad}</td><td>${precio_unitario:.2f}</td><td>${total_producto:.2f}</td></tr>"

    html += f"<tr><td colspan='3'><strong>Total de la Compra</strong></td><td><strong>${total_venta:.2f}</strong></td></tr>"
    html += "</table>"

    filename = f"factura_{cliente.cedula}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    filepath = os.path.join("facturas", filename)

    # Asegúrate de que la ruta de wkhtmltopdf sea correcta en tu entorno
    config = pdfkit.configuration(wkhtmltopdf=r'C:\Users\JHONEYDER QUINTERO\OneDrive - SENA\Documentos\Escritorio\wkhtmltopdf\bin\wkhtmltopdf.exe')

    pdfkit.from_string(html, filepath, configuration=config)
    return filepath

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('inicio'))

if __name__ == '__main__':
    app.run(debug=True)
