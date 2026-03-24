# Proyecto: Búsqueda de Precios de Combustibles 🚗⛽

## Estructura
```
precio_combustible/
├── venv/                   # Virtual environment de Python
├── buscar_nafta.py        # Script principal
├── requirements.txt       # Dependencias del proyecto
└── README.md             # Este archivo
```

## Configuración del Environment

### Activar el Virtual Environment (Windows)
```powershell
.\venv\Scripts\Activate
```

### Desactivar el Virtual Environment
```powershell
deactivate
```

## Dependencias Instaladas
- **requests** (2.32.5): Para hacer peticiones HTTP a la API
- **pandas** (3.0.1): Para procesar y manipular datos
- **numpy** (2.4.3): Para cálculos numéricos (usado en la fórmula haversine)

## Cómo Ejecutar

1. Activar el virtual environment
2. Ejecutar el script:
```powershell
.\venv\Scripts\python buscar_nafta.py
```

## Qué Hace el Script

- Conecta con la API de Datos.gob.ar para obtener precios de combustibles
- Calcula distancias GPS usando la fórmula haversine
- Filtra estaciones por provincia, localidad y radio de búsqueda
- Muestra los resultados ordenados por cercanía o precio

## Parámetros Configurables

En el script principal puedes modificar:
- **LOCALIDAD**: Cambiar la localidad de búsqueda (ej: "MORENO", "LA PLATA")
- **mi_lat, mi_lon**: Coordenadas GPS de tu ubicación
- **radio_km**: Radio de búsqueda en kilómetros (ej: 5, 10, 20)

---
¡Listo para trabajar! 🎉
