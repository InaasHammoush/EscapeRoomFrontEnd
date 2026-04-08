// src/components/inventory/InventoryBar.jsx
import { useEffect, useState } from "react";
import { getInventoryImage, getInventoryUi } from "../../config/items.js";
import inventoryEmptyImg from "../../assets/alchemist/inventory_empty.png";
import inventoryWizardImg from "../../assets/wizard_library/inventory_wizard.png";

const inventoryMixImg = "/inventory_mix.png";

export default function InventoryBar({
  inventory = [],
  mode = "solo",
  role = null,
  roomType = null,
  activeChamber = null,
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredItemKey, setHoveredItemKey] = useState(null);

  useEffect(() => {
    if (!selectedItem) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedItem(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedItem]);

  const selectedImage = selectedItem ? getInventoryImage(selectedItem.item) : null;
  const selectedLabel = selectedItem ? getInventoryUi(selectedItem.item).displayName : "";
  const normalizedMode = String(mode || "").trim().toLowerCase();
  const chamber = String(activeChamber || roomType || "").trim().toLowerCase();
  const roleKey = String(role || "").trim().toUpperCase();

  const inventoryFrame =
    normalizedMode === "solo"
      ? inventoryMixImg
      : chamber.includes("wizard")
      ? inventoryWizardImg
      : chamber.includes("alchemist")
      ? inventoryEmptyImg
      : roleKey === "A" || roleKey === "WIZARD" || roleKey === "WIZARD_LIBRARY"
      ? inventoryWizardImg
      : roleKey === "B" || roleKey === "ALCHEMIST" || roleKey === "ALCHEMIST_LAB"
      ? inventoryEmptyImg
      : inventoryEmptyImg;

  return (
    <>
      <div className="absolute left-[-250px] right-20 top-1/2 -translate-y-1/2 -translate-y-[470px] z-[60] py-2 px-2 pointer-events-none">
        <div className="relative w-[36rem] h-[55rem]">
          <img
            src={inventoryFrame}
            alt="Inventory"
            className="absolute inset-0 w-full h-full object-contain opacity-95 rotate-90"
          />

          <div className="absolute inset-0 grid grid-cols-1 auto-rows-[2.4rem] gap-4 place-items-center content-start px-3 pt-47 pb-2 pointer-events-none">
            {inventory.map((item, index) => {
              const iconSrc = getInventoryImage(item.item);
              if (!iconSrc) return null;

              const itemKey = `${item.item}:${index}`;
              const itemUi = getInventoryUi(item.item);
              const isHovered = hoveredItemKey === itemKey;

              return (
                <div
                  key={itemKey}
                  className="relative h-[3rem] w-[3rem] flex items-center justify-center pointer-events-none"
                >
                  <img
                    src={iconSrc}
                    alt={itemUi.displayName}
                    title={itemUi.displayName}
                    className={`h-full w-full max-h-full max-w-full object-contain pointer-events-auto cursor-grab select-none transition-all duration-200 ease-out ${
                      isHovered
                        ? "-translate-y-1 scale-[1.08] brightness-110 drop-shadow-[0_8px_18px_rgba(244,228,188,0.38)]"
                        : "scale-100 brightness-100"
                    } active:scale-[1.04]`}
                    draggable
                    onMouseEnter={() => setHoveredItemKey(itemKey)}
                    onMouseLeave={() => setHoveredItemKey((current) => (current === itemKey ? null : current))}
                    onClick={() => setSelectedItem(item)}
                    onDragStart={(e) => {
                      const dragKey = String(item.item || "")
                        .trim()
                        .toUpperCase()
                        .replace(/\s+/g, "_");

                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("application/x-inventory-item", dragKey);
                      e.dataTransfer.setData("text/plain", item.item);

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
                    onDragEnd={() => setHoveredItemKey((current) => (current === itemKey ? null : current))}
                  />

                  <div
                    className={`pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-full border border-[#8b7355]/80 bg-[rgba(20,15,10,0.92)] px-3 py-1 text-xs tracking-[0.18em] text-[#f4e4bc] shadow-[0_8px_22px_rgba(0,0,0,0.32)] transition-all duration-200 ease-out ${
                      isHovered ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0"
                    }`}
                  >
                    {itemUi.displayName}
                  </div>
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
              alt={`${selectedLabel} closeup`}
              className="max-w-[80vw] max-h-[75vh] object-contain select-none"
            />
            <p className="mt-3 text-center text-[#f4e4bc] tracking-[0.2em] uppercase">{selectedLabel}</p>
          </div>
        </div>
      )}
    </>
  );
}
