# 🔧 Solución Rápida - Error de Conexión MySQL

## El Problema
MySQL está rechazando la conexión porque necesita configuración.

## 3 Opciones para Solucionarlo

---

## 🟢 OPCIÓN 1: Usar XAMPP (MÁS FÁCIL - RECOMENDADO)

### Paso 1: Descargar XAMPP
1. Ve a: https://www.apachefriends.org/
2. Descarga XAMPP para Windows
3. Instálalo (siguiente, siguiente, siguiente)

### Paso 2: Iniciar MySQL en XAMPP
1. Abre "XAMPP Control Panel"
2. Haz clic en "Start" junto a "MySQL"
3. Debería ponerse verde

### Paso 3: Verificar que no tiene contraseña
Por defecto, XAMPP NO tiene contraseña en MySQL, así que el `.env` actual debería funcionar.

### Paso 4: Ejecutar setup
```bash
npm run setup
```

---

## 🟡 OPCIÓN 2: MySQL ya instalado - Configurar contraseña en .env

Si ya tienes MySQL instalado:

### Paso 1: Averigua tu contraseña de MySQL
¿Recuerdas la contraseña que pusiste al instalar MySQL?

### Paso 2: Edita el archivo `.env`
Abre `.env` y cambia esta línea:
```env
DB_PASSWORD=
```

Por tu contraseña real:
```env
DB_PASSWORD=tu_password_real
```

### Paso 3: Ejecutar setup
```bash
npm run setup
```

---

## 🔵 OPCIÓN 3: Resetear contraseña de MySQL

Si tienes MySQL pero no recuerdas la contraseña:

### Para Windows:

1. Abre "Services" (Servicios de Windows)
2. Busca "MySQL" y detén el servicio
3. Abre CMD como Administrador y ejecuta:
```bash
mysqld --skip-grant-tables
```

4. En otra ventana CMD:
```bash
mysql -u root
```

5. Dentro de MySQL:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'nueva_password';
FLUSH PRIVILEGES;
EXIT;
```

6. Actualiza el `.env`:
```env
DB_PASSWORD=nueva_password
```

---

## ✅ Después de Configurar MySQL

Una vez que MySQL esté funcionando:

```bash
# 1. Configurar base de datos
npm run setup

# 2. Iniciar el servidor
npm start

# 3. Abrir en navegador
# http://localhost:3000/demo
```

---

## 🚫 ¿No quieres instalar MySQL?

### Alternativa: Usar SQLite (más simple)

Si prefieres algo más simple, puedo adaptarte el código para usar SQLite que no requiere instalación de servidor.

¿Quieres que te adapte el código para SQLite? Es solo para desarrollo local y no requiere instalación de nada.

---

## 🆘 Comando de Verificación Rápida

Prueba este comando para ver si MySQL está corriendo:

### Windows (si tienes MySQL instalado):
```bash
mysql -u root -p
```

Si pide contraseña, introdúcela. Si funciona, ese es tu password para el .env

### Windows (si tienes XAMPP):
```bash
C:\xampp\mysql\bin\mysql.exe -u root
```

Si funciona sin pedir contraseña, deja el .env como está (DB_PASSWORD=)

---

## 📞 Dime qué prefieres:

1. ✅ **XAMPP** (más fácil, instalar y listo)
2. ⚙️ **Configurar MySQL existente** (si ya lo tienes)
3. 🔄 **Cambiar a SQLite** (no requiere servidor)

¡Escoge y te ayudo con los pasos exactos!
