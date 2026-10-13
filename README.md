# Calculadora de Costos de Productos y Servicios (CostCalc Pro)

Aplicación web Full Stack para calcular, administrar y cotizar costos de fabricación de productos y prestación de servicios, con determinación de precios de venta mediante **Markup sobre costo** o **Margen sobre precio de venta**, catálogo de insumos y preservación de snapshots históricos.

Desarrollada con **Next.js (App Router)**, **TypeScript estricto**, **Tailwind CSS**, **Supabase (PostgreSQL con RLS)** y compatible con despliegue serverless en **Netlify**.

---

## 🚀 Características Principales

1. **Autenticación y Seguridad Multiusuario**:
   - Registro, inicio de sesión, recuperación de contraseña y cierre de sesión con Supabase Auth.
   - Seguridad con **Row Level Security (RLS)** en PostgreSQL: cada usuario accede exclusivamente a sus propios registros.
   - Sesiones SSR seguras mediante cookies en el servidor y sincronización en navegador con `@supabase/ssr`.
   - Protección de rutas y redirecciones automáticas.

2. **Catálogo de Materiales e Insumos**:
   - Unidades estándar (`ud`, `g`, `kg`, `ml`, `L`, `cm`, `m`) y personalizadas.
   - Cálculo automático del costo unitario: `Costo unitario = Precio total de compra / Cantidad adquirida`.
   - Categorías personalizadas, búsqueda instantánea, filtrado y archivado.
   - Nota conceptual: el catálogo define costos unitarios sin descontar inventario físico.

3. **Selector: Producto o Servicio**:
   - **Producto**: Artículos manufacturados con materiales, mano de obra y gastos para un lote de producción (`output_quantity`).
   - **Servicio**: Trabajos basados principalmente en tiempo y mano de obra, con materiales opcionales.

4. **Motor Matemático en Tiempo Real con Precisión Decimal**:
   - Implementado con `decimal.js` para evitar errores de coma flotante binaria.
   - Recálculo inmediato sin recargar la página.
   - Mano de obra: `(Minutos / 60) × Tarifa horaria` con selector de minutos/horas y confirmación explícita de tarifa ₡0.
   - Costo total del lote = Materiales + Mano de obra + Gastos adicionales.
   - Costo unitario = Costo total del lote / Unidades terminadas.
   - **Markup sobre costo**: `Precio = Costo × (1 + % / 100)`.
   - **Margen sobre venta**: `Precio = Costo / (1 - % / 100)` (validado `< 100%`).

5. **Snapshots Históricos e Integridad de Datos**:
   - Al guardar un cálculo se crea una copia inmutable (`snapshot`) de los costos unitarios, nombres y unidades de los materiales utilizados.
   - Si los precios de los materiales cambian más adelante en el catálogo, los cálculos históricos permanecen inalterados.
   - Al editar una cotización previa, el usuario cuenta con la opción de **"Actualizar con Catálogo"** para sincronizar precios vigentes si lo desea.

6. **Dashboard y Gestión**:
   - Métricas en tiempo real: productos, servicios, materiales registrados y cálculos guardados.
   - Historial completo con filtros por tipo (Producto/Servicio) y estado (Activo/Archivado).
   - Opciones para visualizar desglose completo, editar, duplicar cálculos con un clic y archivar.

7. **Configuración del Negocio**:
   - Configuración de nombre comercial, moneda predeterminada (`CRC`, `USD`, `EUR`), tarifa por hora y margen predeterminado.

---

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 (App Router con React 19)
- **Lenguaje**: TypeScript (Strict Mode)
- **Estilos**: Tailwind CSS con modo claro y oscuro (`next-themes`)
- **Componentes**: Radix UI, Lucide React, Sonner (Toasts)
- **Cálculos Decimales**: `decimal.js`
- **Base de Datos & Auth**: PostgreSQL administrado por Supabase
- **Validación**: Zod
- **Pruebas Automatizadas**: Vitest
- **Despliegue**: Netlify (Serverless)

---

## 📁 Estructura del Proyecto

```text
├── netlify.toml                # Configuración de build y runtime para Netlify
├── supabase/
│   └── migrations/
│       └── 20261012_initial_schema.sql  # Esquema PostgreSQL, RLS y triggers
├── src/
│   ├── app/
│   │   ├── (auth)/             # Páginas públicas: login, register, forgot-password
│   │   ├── (dashboard)/        # Páginas privadas: dashboard, calculator, materials, calculations, settings
│   │   ├── auth/callback/      # Route handler para intercambio de código de autenticación
│   │   ├── layout.tsx          # Root layout con ThemeProvider y Toaster
│   │   └── page.tsx            # Landing page principal
│   ├── components/
│   │   ├── calculators/        # Formulario dinámico y desglose en tiempo real
│   │   ├── materials/          # Tablas, modales de insumos y categorías
│   │   ├── calculations/       # Modales de desglose de costos y listado
│   │   ├── layout/             # Sidebar responsiva, navbar y theme toggle
│   │   ├── settings/           # Formulario de configuración de negocio
│   │   └── ui/                 # Componentes accesibles (Button, Input, Dialog, etc.)
│   ├── features/
│   │   ├── auth/actions.ts     # Server Actions de autenticación
│   │   ├── materials/actions.ts# Server Actions del catálogo de insumos
│   │   ├── calculations/actions.ts # Server Actions para cotizaciones y snapshots
│   │   └── settings/actions.ts # Server Actions de perfil
│   ├── lib/
│   │   ├── calculations/       # Motor matemático puro con Decimal.js
│   │   ├── supabase/           # Clientes SSR para navegador y servidor
│   │   ├── validations/        # Esquemas de validación Zod
│   │   └── utils/              # Formateadores monetarios y helpers
│   ├── proxy.ts                # Middleware/Proxy Next 16 para refresco de sesión y rutas
│   └── types/database.ts       # Definiciones de tipos TypeScript
└── vitest.config.mts           # Configuración de pruebas unitarias
```

---

## ⚙️ Configuración y Puesta en Marcha

### 1. Clonar e Instalar Dependencias

```bash
git clone <url-del-repositorio>
cd cost-calculator-next
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** en el panel de Supabase.
3. Copia el contenido de `supabase/migrations/20261012_initial_schema.sql` y ejecútalo. Esto creará:
   - Tabla `profiles` vinculada a `auth.users`.
   - Tablas `material_categories`, `materials`, `calculations`, `calculation_materials` y `calculation_expenses`.
   - Índices, restricciones CHECK para prevenir números negativos o divisiones por cero.
   - Triggers automáticos para `updated_at` y creación de perfil de usuario.
   - Políticas **Row Level Security (RLS)** en todas las entidades.

### 3. Variables de Entorno

Copia el archivo `.env.example` como `.env.local`:

```bash
cp .env.example .env.local
```

Configura tus credenciales obtenidas de **Project Settings > API** en Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-anon-key
```

### 4. Ejecutar Pruebas Automatizadas

Para validar el motor matemático, validaciones y políticas:

```bash
npm test
```

### 5. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🧪 Pruebas Automatizadas

El proyecto incluye 36 pruebas unitarias implementadas con Vitest:
- Cálculo de costo unitario de materiales (enteros y decimales).
- Consumo por cantidades fraccionarias.
- Conversión de tiempo (minutos/horas) y mano de obra.
- Costo total de lotes y costo unitario.
- Cálculo de **Markup sobre costo** vs **Margen sobre venta**.
- Validación de datos inválidos (margen >= 100%, división por cero, valores negativos).
- Inmutabilidad de snapshots históricos.
- Aislamiento de usuarios mediante políticas RLS.

---

## 🌐 Despliegue en Netlify

El proyecto está configurado para desplegarse en Netlify como una aplicación Next.js moderna:

1. Conecta tu repositorio de GitHub / GitLab en **Netlify**.
2. Netlify detectará la configuración gracias al archivo `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
3. En el panel de Netlify, ve a **Site configuration > Environment variables** y agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`: Tu URL del proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Tu clave anónima (anon public key).
4. Haz clic en **Deploy site**.
5. En la consola de Supabase (**Authentication > URL Configuration**), agrega la URL generada por Netlify a las **Redirect URLs** permitidas para que los flujos de correo y confirmación funcionen correctamente.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT.
