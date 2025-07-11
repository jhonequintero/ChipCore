from flask import Flask, request, redirect, session, url_for, render_template, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, cast, Integer
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
from num2words import num2words
import re
import random
import threading
import pytz
import pdfkit
from flask_mail import Mail, Message
import io

app = Flask(__name__)
app.secret_key = 'Clave_JhoneiderQuintero_chipcore_2023'



# --- INICIO DE CAMBIOS PARA WKHTMLTOPDF Y FLASK-MAIL ---
if os.name == 'nt':
    WKHTMLTOPDF_PATH = r"C:\wkhtmltopdf\bin\wkhtmltopdf.exe"
    config_pdf = pdfkit.configuration(wkhtmltopdf=WKHTMLTOPDF_PATH)
else:
    config_pdf = None  

# Configuración de Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'marcelaquintero973@gmail.com'
app.config['MAIL_PASSWORD'] = 'dzarsqoqqhxpqcub' 
app.config['MAIL_DEFAULT_SENDER'] = 'marcelaquintero973@gmail.com'

mail = Mail(app) # Inicializa Flask-Mail con la aplicación

# --- FIN DE CAMBIOS PARA WKHTMLTOPDF Y FLASK-MAIL ---


# Configuración de la base de datos SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://user_chipcore:HGDR4ltK7hHdyOmt7uRISoA70RYNBHym@dpg-d19ag0idbo4c73d3q3s0-a.oregon-postgres.render.com:5432/base_microchip?sslmode=require"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


class Usuario(db.Model):
    _tablename_ = 'usuario'
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
    _tablename_ = 'producto'
    id_producto = db.Column(db.Integer, primary_key=True)
    nombre_producto = db.Column(db.String(100), nullable=False)
    descripcion_producto = db.Column(db.String(200), nullable=True)
    precio_producto = db.Column(db.Float, nullable=False)
    cantidad_producto = db.Column(db.Integer, nullable=False)


class Cliente(db.Model):
    _tablename_ = 'cliente'
    id_cliente = db.Column(db.Integer, primary_key=True)
    nombre_completo = db.Column(db.String(200), nullable=False)
    correo = db.Column(db.String(100), unique=True, nullable=False)
    cedula = db.Column(db.String(11), unique=True, nullable=False)


class Carrito(db.Model):
    _tablename_ = 'carrito'
    id_carrito = db.Column(db.Integer, primary_key=True)
    id_cliente = db.Column(db.Integer, db.ForeignKey('cliente.id_cliente'), nullable=False)
    id_producto = db.Column(db.Integer, db.ForeignKey('producto.id_producto'), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    fecha = db.Column(db.DateTime, default=db.func.current_timestamp())

class VentaCabecera(db.Model):
    _tablename_ = 'venta_cabecera'
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
    _tablename_ = 'venta_detalle'
    id_detalle = db.Column(db.Integer, primary_key=True)
    id_venta = db.Column(db.Integer, db.ForeignKey('venta_cabecera.id_venta'))
    id_producto = db.Column(db.Integer, db.ForeignKey('producto.id_producto'))
    cantidad = db.Column(db.Integer)
    precio = db.Column(db.Float) 

    venta = db.relationship('VentaCabecera', backref='detalles')
    producto = db.relationship('Producto')

# --- Fin de tus modelos SQLAlchemy ---


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

# --- Rutas de autenticación y paneles (permanecen mayormente iguales) ---
@app.route('/')
def inicio():
    return render_template('index.html', error=None)

@app.route('/login', methods=['POST'])
def login():
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
                return jsonify(success=False, error="Rol de usuario no reconocido", campo="ambos")
        else:
            return jsonify(success=False, error="Contraseña incorrecta", campo="contrasena")

    return jsonify(success=False, error="Correo o contraseña incorrectos", campo="ambos")



@app.route('/actualizar_perfil', methods=['POST'])
def actualizar_perfil():
    if 'usuario' not in session:
        return jsonify({"success": False, "msg": "No has iniciado sesión."}), 401

    user_id = session.get('id_usuario')
    user = Usuario.query.filter_by(id_usuario=user_id).first()

    if not user:
        return jsonify({"success": False, "msg": "Usuario no encontrado"}), 404

    # Obtener datos del formulario
    nombre = request.form.get('nombre', '').strip()
    apellido = request.form.get('apellido', '').strip()
    correo = request.form.get('correo', '').strip()
    contrasena_actual = request.form.get('contrasena_actual', '').strip()
    nueva_contrasena = request.form.get('nueva_contrasena', '').strip()

    # Verificar que la contraseña actual sea válida
    if not check_password_hash(user.contrasena, contrasena_actual):
        return jsonify({"success": False, "msg": "❌ Contraseña actual incorrecta"}), 403

    # Actualizar campos
    user.nombre = nombre
    user.apellido = apellido
    user.correo = correo

    if nueva_contrasena:
        user.contrasena = generate_password_hash(nueva_contrasena)

    try:
        db.session.commit()
        return jsonify({"success": True, "msg": "✅ Perfil actualizado correctamente"})
    except Exception as e:
        db.session.rollback()
        print("Error al actualizar perfil:", e)
        return jsonify({"success": False, "msg": "❌ Error al actualizar perfil"}), 500
    
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

        empleados = Usuario.query.filter_by(rol='empleado').order_by(Usuario.id_usuario.asc()).all()
        productos = Producto.query.order_by(Producto.id_producto.asc()).all()

        facturas = VentaCabecera.query.all()

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

        return jsonify(success=True, mensaje="✅ Empleado registrado exitosamente.", empleado={
            'nombre': nombre,
            'apellido': apellido,
            'correo': correo,
            'codigo_empleado': nuevo_codigo
        })


    return jsonify(success=False, error="Acceso no autorizado.")


@app.route('/recuperar_contrasena', methods=['POST'])
def recuperar_contrasena():
    data = request.get_json()
    correo = data.get("correo")

    usuario = Usuario.query.filter_by(correo=correo).first()
    if not usuario:
        return jsonify({"success": False, "msg": "Correo no registrado"})

    # Generar token temporal de recuperación
    token = secrets.token_urlsafe(32)

    # Puedes guardarlo en base de datos o usar JWT
    link = url_for('resetear_contrasena', token=token, _external=True)

    # Envía el correo
    enviar_correo(correo, "Recupera tu contraseña", f"Da clic aquí para restablecer: {link}")

    return jsonify({"success": True})



@app.route('/panel_trabajador')
def panel_trabajador():
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
            productos = Producto.query.order_by(Producto.id_producto.asc()).all()
            facturas = VentaCabecera.query.filter_by(id_vendedor=usuario.id_usuario).all()

            return render_template('panel_trabajador.html',
                                   datos=datos,
                                   productos=productos,
                                   facturas=facturas)
    return redirect(url_for('inicio'))


@app.route('/usuario/<int:id_usuario>/cambiar_estado', methods=['POST'])
def cambiar_estado_usuario(id_usuario):
    if 'usuario' in session and session.get('tipo') == 'administrador':
        usuario = Usuario.query.filter_by(id_usuario=id_usuario).first()
        if not usuario:
            return jsonify({'success': False, 'msg': 'Usuario no encontrado'}), 404

        usuario.estado = not usuario.estado
        db.session.commit()
        return jsonify({'success': True, 'nuevo_estado': usuario.estado})
    return jsonify({'success': False, 'msg': 'Acceso no autorizado'}), 403

@app.route('/agregar_producto', methods=['POST'])
def agregar_producto():
    if 'usuario' in session and session.get('tipo') == 'administrador':
        try:
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

            return jsonify(success=True, mensaje="✅ Producto registrado con éxito", producto={
                'nombre': nombre,
                'descripcion': descripcion,
                'precio': precio,
                'cantidad': cantidad
            })

        except Exception as e:
            print("Error al registrar producto:", e)
            return jsonify(success=False, error="❌ Hubo un error al registrar el producto.")

    return jsonify(success=False, error="Acceso no autorizado.")


@app.route('/ver_productos')
def ver_productos():
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
    if 'usuario' in session and session.get('tipo') == 'administrador':
        try:
            id_producto = int(request.form.get('id_producto'))
            nombre = request.form.get('nombre_producto')
            descripcion = request.form.get('descripcion_producto')
            cantidad = int(request.form.get('cantidad_producto'))
            precio = float(request.form.get('precio_producto'))

            producto = db.session.get(Producto, id_producto)  # método recomendado en SQLAlchemy 2
            if producto:
                producto.nombre_producto = nombre
                producto.descripcion_producto = descripcion
                producto.cantidad_producto = cantidad
                producto.precio_producto = precio
                db.session.commit()
                return jsonify({'success': True, 'mensaje': 'Producto actualizado correctamente'})
            else:
                return jsonify({'success': False, 'error': 'Producto no encontrado'})
        except Exception as e:
            print(f"Error al actualizar producto: {e}")
            return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500
    return jsonify({'success': False, 'error': 'Acceso no autorizado'}), 403


@app.route('/verificar_producto', methods=['POST'])
def verificar_producto():
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

from datetime import datetime
import random
from flask import jsonify, request, session

@app.route('/finalizar_compra', methods=['POST'])
def finalizar_compra():
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
            db.session.commit()

        # Obtener hora de Colombia correctamente
        zona_colombia = pytz.timezone("America/Bogota")
        fecha_actual = datetime.now(zona_colombia)
        hora_actual = fecha_actual.strftime("%H:%M:%S")
        folio_venta = f"F{fecha_actual.strftime('%Y%m%d%H%M%S')}{random.randint(100,999)}"


        total_venta = 0
        detalles_compra = []

        # Verificar stock y calcular totales
        for item in carrito_data:
            producto = db.session.get(Producto, item["id"])
            if not producto:
                return jsonify({"mensaje": f"Producto con ID {item['id']} no encontrado"}), 400

            cantidad_comprada = item["cantidad"]
            if producto.cantidad_producto < cantidad_comprada:
                return jsonify({
                    "mensaje": f"No hay suficiente stock del producto '{producto.nombre_producto}'. Stock disponible: {producto.cantidad_producto}"
                }), 400

            total_producto = cantidad_comprada * producto.precio_producto
            total_venta += total_producto

            detalles_compra.append({
                "producto": producto,
                "cantidad": cantidad_comprada,
                "precio_unitario": producto.precio_producto,
                "total_producto": total_producto
            })

        # Registrar venta cabecera
        venta_cabecera = VentaCabecera(
            folio=folio_venta,
            fecha=fecha_actual,
            hora=hora_actual,
            id_cliente=cliente.id_cliente,
            id_vendedor=vendedor.id_usuario,
            total=total_venta
        )
        db.session.add(venta_cabecera)
        db.session.flush()

        # Registrar detalles de la venta
        for detalle_item in detalles_compra:
            producto = detalle_item["producto"]
            cantidad = detalle_item["cantidad"]
            precio_unitario = detalle_item["precio_unitario"]

            venta_detalle = VentaDetalle(
                id_venta=venta_cabecera.id_venta,
                id_producto=producto.id_producto,
                cantidad=cantidad,
                precio=precio_unitario
            )
            db.session.add(venta_detalle)

            # Descontar stock
            producto.cantidad_producto -= cantidad

        db.session.commit()

        # Preparar datos para PDF
        datos_para_pdf = {
            'nombre_cliente': cliente.nombre_completo,
            'contacto_cliente': cliente.correo,
            'cc_cliente': cliente.cedula,
            'ciudad_cliente': 'N/A',
            'fecha_generacion': fecha_actual.strftime('%d/%m/%Y'),
            'hora_generacion': fecha_actual.strftime('%I:%M:%S %p'),
            'fecha_vencimiento': fecha_actual.strftime('%Y/%m/%d'),
            'vendedor': vendedor.nombre,
            'forma_pago': 'Contado',
            'items_factura': [
                {
                    'referencia': d["producto"].id_producto,
                    'descripcion': d["producto"].nombre_producto,
                    'cantidad': d["cantidad"],
                    'precio_unit': f"${d['precio_unitario']:.2f}",
                    'valor_total_item': f"${d['total_producto']:.2f}"
                } for d in detalles_compra
            ],
            'descuentos': '$0.00',
            'total_final': f"${total_venta:.2f}",
            'valor_letras': convertir_a_letras(total_venta),
            'notas': 'Gracias por su compra en Microchip.'
        }

        # Generar PDF y enviar correo
        pdf_bytes = generar_pdf(datos_para_pdf)

        venta_info_correo = {
            "nombre_cliente": cliente.nombre_completo,
            "fecha": fecha_actual.strftime('%Y-%m-%d'),
            "hora": hora_actual,
            "folio": folio_venta,
            "total": total_venta,
            "vendedor": vendedor.nombre
        }

        enviar_factura_async(cliente.correo, pdf_bytes, venta_info_correo)

        return jsonify({"mensaje": "✅ Compra finalizada, registro guardado y factura enviada al correo."})

    except Exception as e:
        db.session.rollback()
        print("Error en /finalizar_compra:", e)
        return jsonify({"mensaje": "Error interno del servidor.", "detalle": str(e)}), 500

def convertir_a_letras(numero):
    """
    Convierte un número (entero o flotante) a su representación en letras en español,
    incluyendo el manejo de centavos (moneda).
    """
    try:
        # Separar la parte entera y la parte decimal
        parte_entera = int(numero)
        parte_decimal = round((numero - parte_entera) * 100) # Obtener los centavos

        letras_entera = num2words(parte_entera, lang='es')

        # Formatear la parte entera
        if parte_entera == 1:
            letras_entera = letras_entera.replace("un", "UNO") # Para asegurar "UN PESO"
        else:
            letras_entera = letras_entera.upper() # Convertir todo a mayúsculas

        resultado = f"{letras_entera} PESOS"

        if parte_decimal > 0:
            letras_decimal = num2words(parte_decimal, lang='es').upper()
            resultado += f" CON {letras_decimal} CENTAVOS"
        else:
            resultado += " EXACTOS" # O simplemente dejarlo sin "exactos" si no lo necesitas

        return resultado + " M/CTE *******"

    except Exception as e:
        return f"Error al convertir el número: {e}"


@app.route('/api/ventas')
def api_ventas():
    if 'usuario' not in session or session.get('tipo') not in ['administrador', 'empleado']:
        return jsonify({"error": "Acceso no autorizado para ver ventas"}), 403

    user_id = session.get('id_usuario')
    user_rol = session.get('tipo')

    query = db.session.query(
        VentaCabecera.fecha,
        VentaCabecera.hora,
        VentaCabecera.folio,
        Cliente.nombre_completo.label('nombre_cliente'),
        Cliente.cedula.label('cedula_cliente'),
        Producto.id_producto.label('codigo_producto'),
        Producto.nombre_producto.label('nombre_producto'),
        VentaDetalle.cantidad,
        VentaDetalle.precio.label('precio_unitario_detalle'),
        (VentaDetalle.cantidad * VentaDetalle.precio).label('total_detalle_producto'),
        VentaCabecera.total.label('total_venta_cabecera'),
        Usuario.nombre.label('vendedor')
    ) \
    .join(Cliente, VentaCabecera.id_cliente == Cliente.id_cliente) \
    .join(Usuario, VentaCabecera.id_vendedor == Usuario.id_usuario) \
    .join(VentaDetalle, VentaDetalle.id_venta == VentaCabecera.id_venta) \
    .join(Producto, VentaDetalle.id_producto == Producto.id_producto)

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


def enviar_factura(destinatario, pdf_data, venta_info):
    asunto = "Factura de tu compra en Microchip"

    try:
        # TODO LO RELACIONADO CON FLASK-MAIL DEBE ESTAR DENTRO DE ESTE BLOQUE
        with app.app_context():
            # 1. Renderizar el HTML para el cuerpo del correo
            cuerpo_html_email = render_template('email_factura.html', venta_info=venta_info)
            print(f"DEBUG: HTML del correo generado para {destinatario}")

            # 2. Crear el objeto Message
            msg = Message(subject=asunto, recipients=[destinatario])
            msg.html = cuerpo_html_email
            print("DEBUG: Mensaje de Flask-Mail creado.")

            # 3. Adjuntar el PDF
            msg.attach(
                filename=f"factura_{venta_info['folio']}.pdf",
                content_type="application/pdf",
                data=pdf_data
            )
            print("DEBUG: PDF adjuntado al mensaje.")

            # 4. Enviar el correo
            mail.send(msg)
            print(f"✅ Correo enviado a {destinatario}")

    except Exception as e:
        print(f"❌ Error al enviar correo a {destinatario}: {e}")
        print(f"Error detallado: {e}") 

def enviar_factura_async(destinatario, pdf_data, venta_info):
    hilo = threading.Thread(target=enviar_factura, args=(destinatario, pdf_data, venta_info))
    hilo.start()


def generar_pdf(datos_para_pdf):
    with app.app_context(): 
        html_string = render_template('factura_pdf.html', **datos_para_pdf) # Desempaqueta el diccionario

    # Usamos configuration=config_pdf que ya definimos globalmente.
    pdf_bytes = pdfkit.from_string(html_string, False, configuration=config_pdf, options={'enable-local-file-access': None}) # 'False' indica que devuelva bytes, no guarde archivo.
    return pdf_bytes

# --- Tu ruta de logout ---
@app.route('/logout')
def logout():
    """
    Cierra la sesi n actual y redirige al usuario al inicio.

    No recibe par metros ni devuelve nada, solo redirige a la p gina de inicio.
    """
    session.clear()
    return redirect(url_for('inicio'))

if __name__ == '__main__':
    app.run(debug=True)