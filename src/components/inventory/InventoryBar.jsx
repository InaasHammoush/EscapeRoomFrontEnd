// src/components/inventory/InventoryBar.jsx
import { useEffect, useState } from "react";
import { getInventoryImage } from "../../config/items.js";
import { getInventoryUi } from "../../config/items.js";
import inventoryEmptyImg from "../../assets/alchemist/inventory_empty.png";

export default function InventoryBar({ inventory = [] }) {
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (!selectedItem) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedItem(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedItem]);

  const selectedImage = selectedItem ? getInventoryImage(selectedItem.item) : null;

  return (
    <>
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
                  className="h-[3rem] w-[3rem] flex items-center justify-center pointer-events-none"
                >
                  <img
                    src={iconSrc}
                    alt={item.item}
                    className="h-full w-full max-h-full max-w-full object-contain pointer-events-auto cursor-grab select-none"
                    draggable
                    onClick={() => setSelectedItem(item)}
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

      {selectedItem && selectedImage && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 backdrop-blur-sm pointer-events-auto"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] bg-[#1a1510] border border-[#8b7355] rounded-md p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close item closeup"
              className="absolute -top-3 -right-3 h-9 w-9 rounded-full border-2 border-[#8b7355] bg-black text-[#f4e4bc] text-lg cursor-pointer"
              onClick={() => setSelectedItem(null)}
            >
              x
            </button>

            <img
              src={selectedImage}
              alt={`${selectedItem.item} closeup`}
              className="max-w-[80vw] max-h-[75vh] object-contain select-none"
            />
            <p className="mt-3 text-center text-[#f4e4bc] tracking-wide">{selectedItem.item}</p>
          </div>
        </div>
      )}
    </>
  );
}
