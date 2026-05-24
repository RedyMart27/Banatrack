# Lógica de Negocio Bananera - BanaTrack

## Conceptos clave
- **Embolse**: Cuando se pone la bolsa plástica al racimo. Se registra con una cinta de color.
- **Cosecha**: Corte del racimo según semanas transcurridas desde el embolse.
- **Descuento**: Embolse total - cosecha del día.
- **Recobro**: Descuento / Embolse total. Resultado entre 0 y 1 (ej: 0.91).

## Colores de cintas y orden del ciclo
BL (Blanco) → AZ (Azul) → RO (Rojo) → CA (Café) → NE (Negro) → NA (Naranja) → VE (Verde) → AM (Amarillo)
El ciclo se repite cada 8 semanas.

## Semanas de cosecha
Un racimo se cosecha entre la semana 8 y 12 desde su embolse.
Las semanas más comunes son 8, 10, 11 y 12 según pedido del comprador y calibre.

## Cálculos principales
- descuento = embolse_total - cosecha_dia
- recobro = descuento / embolse_total (redondeado a 2 decimales)

## Estructura de datos
- Un supervisor maneja varios lotes
- Cada lote tiene registros diarios de embolse por color de cinta
- Cada lote tiene registros diarios de cosecha por color de cinta
- El calendario bananero divide el año en 52 semanas numeradas