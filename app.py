from flask import Flask, request, redirect, session, url_for, render_template, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import re

app = Flask(__name__)
app.secret_key = 'Clave_JhoneiderQuintero_chipcore_2023'

app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://chipcore_user:QJ4oZIaYL90TkcEsX2OewT7eFunk4REv@dpg-d0l3el7fte5s73962vmg-a.oregon-postgres.render.com:5432/base_datos_chipcore"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Usuario(db.Model):
    __tablename__ = 'usuario'
    codigo = db.Column(db.Integer, primary_key=True)  # este se auto incrementa
    id_usuario = db.Column(db.Integer, unique=True, nullable=False)  
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=False)
    correo = db.Column(db.String(100), unique=True, nullable=False)
    contrasena = db.Column(db.String(200), nullable=False)
    rol = db.Column(db.String(20), nullable=False)
    estado = db.Column(db.Boolean, default=True)


class Producto(db.Model):
    __tablename__ = 'producto'
    id_producto = db.Column(db.Integer, primary_key=True)
    nombre_producto = db.Column(db.String(100), nullable=False)
    descripcion_producto = db.Column(db.String(200), nullable=True)
    precio_producto = db.Column(db.Float, nullable=False)
    cantidad_producto = db.Column(db.Integer, nullable=False)

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
            "codigo": f"EMP{str(usuario.id_usuario).zfill(3)}"
        }

        empleados = Usuario.query.filter_by(rol='empleado', estado=True).all()
        productos = Producto.query.all()

        return render_template('panel_admin.html', datos=datos, usuarios=empleados, productos=productos)

    return redirect(url_for('inicio'))

@app.route('/registrar_empleado', methods=['POST'])
def registrar_empleado():
    if 'usuario' in session and session.get('tipo') == 'administrador':
        nombre = request.form.get('nombre', '').strip()
        apellido = request.form.get('apellido', '').strip()
        correo = request.form.get('correo', '').strip()
        contrasena = request.form.get('contrasena', '').strip()

        if not nombre or not apellido or not correo or not contrasena:
            return jsonify(success=False, error="Todos los campos son requeridos.")

        if Usuario.query.filter_by(correo=correo).first():
            return jsonify(success=False, error="El correo ya está registrado.")

        # Calcular el próximo id_usuario manualmente:
        max_id = db.session.query(db.func.max(Usuario.id_usuario)).scalar()
        nuevo_id_usuario = (max_id or 1000) + 1  # Empieza en 1001 si está vacío

        nuevo_empleado = Usuario(
            id_usuario=nuevo_id_usuario,
            nombre=nombre,
            apellido=apellido,
            correo=correo,
            contrasena=generate_password_hash(contrasena),
            rol='empleado',
            estado=True
        )

        db.session.add(nuevo_empleado)
        db.session.commit()

        return jsonify(success=True, mensaje="Empleado registrado exitosamente.")

    return jsonify(success=False, error="Acceso no autorizado.")

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
                "codigo": f"EMP{str(usuario.id_usuario).zfill(3)}"
            }
            return render_template('panel_trabajador.html', datos=datos)
    return redirect(url_for('inicio'))


@app.route('/agregar_producto', methods=['POST'])
def agregar_producto():
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

        # Redirigir a panel_admin para que se muestre todo junto
        return redirect(url_for('panel_admin'))
    return redirect(url_for('inicio'))


@app.route('/ver_productos')
def ver_productos():
    if 'usuario' in session and session.get('tipo') == 'administrador':
        usuario = Usuario.query.filter_by(correo=session['usuario']).first()
        productos = Producto.query.all()
        empleados = Usuario.query.filter_by(rol='empleado', estado=True).all()  # <--- Esto
        datos = {
            "id": usuario.id_usuario,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo,
            "rol": usuario.rol,
            "codigo": f"EMP{str(usuario.id_usuario).zfill(3)}"
        }
        # Pasamos empleados y productos para que el panel admin muestre todo
        return render_template('panel_admin.html', datos=datos, vista='productos', productos=productos, usuarios=empleados)
    return redirect(url_for('inicio'))

@app.route('/actualizar_producto', methods=['POST'])
def actualizar_producto():
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


@app.route('/comprar/<int:id_producto>', methods=['POST'])
def comprar_producto(id_producto):
    cantidad_comprada = int(request.form['cantidad'])

    producto = Producto.query.get(id_producto)
    if producto and producto.cantidad_producto >= cantidad_comprada:
        producto.cantidad_producto -= cantidad_comprada
        db.session.commit()
    return redirect(url_for('ver_productos'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('inicio'))

if __name__ == '__main__':
    app.run(debug=True)
