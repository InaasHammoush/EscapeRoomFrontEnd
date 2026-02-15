// src/components/inventory/InventoryBar.jsx
import { getInventoryImage } from "../../config/items.js";
import inventoryEmptyImg from "../../assets/alchemist/inventory_empty.png";

export default function InventoryBar({ inventory = [] }) {
  return (
    <div className="absolute left-[-250px] right-20 top-1/2 -translate-y-1/2 -translate-y-[470px] z-[60] py-2 px-2 pointer-events-none">
      <div className="relative w-[36rem] h-[55rem]">
        <img
          src={inventoryEmptyImg}
          alt="Inventory"
          className="absolute inset-0 w-full h-full object-contain opacity-95 rotate-90"
        />

        <div className="absolute inset-0 grid grid-cols-1 auto-rows-[2.4rem] gap-4 place-items-center content-start px-3 pt-47 pb-2 pointer-events-none">
          {inventory.map((item) => {
            const iconSrc = getInventoryImage(item.item);
            if (!iconSrc) return null;

            return (
              <div
                key={item.item}
                className="flex flex-col items-center gap-0 px-0 py-0 pointer-events-none"
              >
                <img
                  src={iconSrc}
                  alt={item.item}
                  className="h-25 w-25 object-contain pointer-events-auto cursor-grab"
                  draggable
                  onDragStart={(e) => {
                    const dragKey = String(item.item || "")
                      .trim()
                      .toUpperCase()
                      .replace(/\s+/g, "_");

                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("application/x-inventory-item", dragKey);
                    e.dataTransfer.setData("text/plain", item.item);

                    // pretty drag preview
                    const dragPreview = document.createElement("img");
                    dragPreview.src = iconSrc;
                    dragPreview.style.width = "96px";
                    dragPreview.style.height = "96px";
                    dragPreview.style.objectFit = "contain";
                    dragPreview.style.position = "fixed";
                    dragPreview.style.left = "-1000px";
                    dragPreview.style.top = "-1000px";
                    dragPreview.style.pointerEvents = "none";
                    document.body.appendChild(dragPreview);

                    e.dataTransfer.setDragImage(dragPreview, 48, 48);
                    setTimeout(() => dragPreview.remove(), 0);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}