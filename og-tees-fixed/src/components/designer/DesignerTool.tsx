'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Type,
  Wand2,
  Undo2,
  Redo2,
  Trash2,
  ShoppingCart,
  Save,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronLeft,
  Loader2,
  Palette,
  Upload,
} from 'lucide-react';
import { useDesignerStore } from '@/store/designerStore';
import { useCartStore } from '@/store/cartStore';
import { clipartLibrary } from '@/data/clipart';
import { Product } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DesignerToolProps {
  product: Product;
  initialColor?: string;
}

// Loose Fabric types to avoid needing @types/fabric
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricLib = any;

// ─── Constants ──────────────────────────────────────────────────────────────

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PRINT_AREA = { left: 220, top: 80, width: 360, height: 430 };

const FONT_FAMILIES = [
  'Arial',
  'Impact',
  'Georgia',
  'Courier New',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
  'Comic Sans MS',
];

const VIEW_LABELS: Record<string, string> = {
  front: 'Front',
  back: 'Back',
  left: 'Left',
  right: 'Right',
};

const CATEGORY_COLORS = [
  '#000000', '#FFFFFF', '#10b981', '#1A1A1A', '#1B2B5E',
  '#C41230', '#1F4FA8', '#2D5E40', '#8A8A8A', '#C9A0A0',
  '#C8A415', '#1A7A3C', '#B22222', '#4B286D', '#E05C00',
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function PanelButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`w-full py-4 flex flex-col items-center gap-1 text-[10px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-inset ${
        active
          ? 'bg-emerald-500 text-white'
          : 'text-slate-400 hover:text-white hover:bg-slate-700'
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      {label}
    </button>
  );
}

function ColorSwatch({
  color,
  selected,
  onClick,
  size = 'md',
}: {
  color: string;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <button
      type="button"
      onClick={onClick}
      title={color}
      className={`${sizeClass} rounded-full border-2 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-800 ${
        selected
          ? 'border-emerald-400 scale-110 shadow-md ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-800'
          : 'border-white shadow-[0_0_0_1px_#e5e7eb] hover:scale-110'
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DesignerTool({ product, initialColor }: DesignerToolProps) {
  const router = useRouter();

  // Refs
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const fabricLibRef = useRef<FabricLib | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store
  const {
    selectedView,
    selectedColor,
    activePanel,
    undoStack,
    redoStack,
    saveCanvasState,
    undo,
    redo,
    setView: setSelectedView,
    setColor: setSelectedColor,
    setActivePanel,
    reset,
  } = useDesignerStore();

  const { addItem, openCart } = useCartStore();

  // Local UI state
  const [fabricReady, setFabricReady] = useState(false);
  const [selectedObject, setSelectedObject] = useState<FabricLib | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [saving, setSaving] = useState(false);

  // Text tool state
  const [textInput, setTextInput] = useState('Your Text Here');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(36);
  const [textColor, setTextColor] = useState('#1A1A1A');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');

  // AI panel state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiEnabled] = useState(
    typeof process !== 'undefined' && !!process.env.NEXT_PUBLIC_AI_ENABLED
  );

  // Size/color selector
  const [selectedSize, setSelectedSize] = useState(product.sizes[2] ?? product.sizes[0]);

  // Initialise selected color
  useEffect(() => {
    const initColor = initialColor ?? product.colors[0]?.name ?? '';
    if (!selectedColor) setSelectedColor(initColor);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Current garment image
  const currentColorData = product.colors.find((c) => c.name === selectedColor) ?? product.colors[0];
  const garmentImageSrc = (() => {
    const imgs = currentColorData?.images;
    if (!imgs) return '';
    switch (selectedView) {
      case 'back': return imgs.back;
      case 'left': return imgs.left ?? imgs.front;
      case 'right': return imgs.right ?? imgs.front;
      default: return imgs.front;
    }
  })();

  // ── Fabric.js init ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!canvasElRef.current) return;

    import('fabric').then((mod) => {
      const fabric: FabricLib = mod.fabric ?? mod.default ?? mod;
      fabricLibRef.current = fabric;

      const canvas: FabricCanvas = new fabric.Canvas(canvasElRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: 'transparent',
        preserveObjectStacking: true,
        selection: true,
      });

      fabricRef.current = canvas;

      // Draw print area dashed rect
      const printRect = new fabric.Rect({
        left: PRINT_AREA.left,
        top: PRINT_AREA.top,
        width: PRINT_AREA.width,
        height: PRINT_AREA.height,
        fill: 'transparent',
        stroke: '#10b981',
        strokeWidth: 1.5,
        strokeDashArray: [8, 5],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        name: '__printArea',
      });
      canvas.add(printRect);
      canvas.renderAll();

      // Event listeners
      const saveState = () => {
        const objects = canvas.getObjects().filter((o: FabricLib) => o.name !== '__printArea');
        if (objects.length === 0) return;
        saveCanvasState(JSON.stringify(canvas.toJSON(['name', 'excludeFromExport'])));
      };

      canvas.on('object:modified', saveState);
      canvas.on('object:added', (e: FabricLib) => {
        if (e.target?.name !== '__printArea') saveState();
      });
      canvas.on('object:removed', (e: FabricLib) => {
        if (e.target?.name !== '__printArea') saveState();
      });

      canvas.on('selection:created', (e: FabricLib) => setSelectedObject(e.selected?.[0] ?? null));
      canvas.on('selection:updated', (e: FabricLib) => setSelectedObject(e.selected?.[0] ?? null));
      canvas.on('selection:cleared', () => setSelectedObject(null));

      setFabricReady(true);

      return () => {
        canvas.dispose();
        fabricRef.current = null;
        setFabricReady(false);
      };
    });
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Responsive canvas scaling ──────────────────────────────────────────────

  useEffect(() => {
    const resize = () => {
      if (!containerRef.current || !fabricRef.current) return;
      const containerW = containerRef.current.clientWidth;
      const scale = Math.min(1, containerW / CANVAS_WIDTH);
      fabricRef.current.setZoom(scale);
      fabricRef.current.setWidth(CANVAS_WIDTH * scale);
      fabricRef.current.setHeight(CANVAS_HEIGHT * scale);
      fabricRef.current.renderAll();
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [fabricReady]);

  // ── Canvas actions ─────────────────────────────────────────────────────────

  const handleUndo = useCallback(() => {
    const json = undo();
    if (json && fabricRef.current && fabricLibRef.current) {
      fabricRef.current.loadFromJSON(json, () => {
        fabricRef.current.renderAll();
        // Re-add print area if missing
        const hasPrintArea = fabricRef.current.getObjects().some((o: FabricLib) => o.name === '__printArea');
        if (!hasPrintArea && fabricLibRef.current) {
          const printRect = new fabricLibRef.current.Rect({
            left: PRINT_AREA.left, top: PRINT_AREA.top,
            width: PRINT_AREA.width, height: PRINT_AREA.height,
            fill: 'transparent', stroke: '#10b981', strokeWidth: 1.5,
            strokeDashArray: [8, 5], selectable: false, evented: false,
            excludeFromExport: true, name: '__printArea',
          });
          fabricRef.current.add(printRect);
          fabricRef.current.sendToBack(printRect);
          fabricRef.current.renderAll();
        }
      });
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const json = redo();
    if (json && fabricRef.current && fabricLibRef.current) {
      fabricRef.current.loadFromJSON(json, () => fabricRef.current.renderAll());
    }
  }, [redo]);

  const handleClear = useCallback(() => {
    if (!fabricRef.current || !fabricLibRef.current) return;
    const objects = fabricRef.current.getObjects().filter((o: FabricLib) => o.name !== '__printArea');
    objects.forEach((o: FabricLib) => fabricRef.current.remove(o));
    fabricRef.current.discardActiveObject();
    fabricRef.current.renderAll();
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (!fabricRef.current) return;
    const active = fabricRef.current.getActiveObject();
    if (active && active.name !== '__printArea') {
      fabricRef.current.remove(active);
      fabricRef.current.discardActiveObject();
      fabricRef.current.renderAll();
    }
  }, []);

  // ── Text tool ──────────────────────────────────────────────────────────────

  const addText = useCallback(() => {
    if (!fabricRef.current || !fabricLibRef.current) return;
    const fabric = fabricLibRef.current;
    const text = new fabric.IText(textInput || 'Your Text', {
      left: PRINT_AREA.left + PRINT_AREA.width / 2,
      top: PRINT_AREA.top + PRINT_AREA.height / 2,
      originX: 'center',
      originY: 'center',
      fontFamily,
      fontSize,
      fill: textColor,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      underline: isUnderline,
      textAlign,
      editable: true,
      name: `text_${Date.now()}`,
    });
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll();
  }, [textInput, fontFamily, fontSize, textColor, isBold, isItalic, isUnderline, textAlign]);

  // Update selected text object when properties change
  const updateSelectedText = useCallback((updates: Record<string, unknown>) => {
    if (!fabricRef.current || !selectedObject) return;
    const active = fabricRef.current.getActiveObject();
    if (active && active.type === 'i-text') {
      active.set(updates);
      fabricRef.current.renderAll();
    }
  }, [selectedObject]);

  // ── Clipart tool ───────────────────────────────────────────────────────────

  const addClipart = useCallback((svgContent: string, name: string) => {
    if (!fabricRef.current || !fabricLibRef.current) return;
    const fabric = fabricLibRef.current;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    fabric.loadSVGFromURL(url, (objects: FabricLib[], options: FabricLib) => {
      const group = fabric.util.groupSVGElements(objects, options);
      group.set({
        left: PRINT_AREA.left + PRINT_AREA.width / 2,
        top: PRINT_AREA.top + PRINT_AREA.height / 2,
        originX: 'center',
        originY: 'center',
        scaleX: 0.8,
        scaleY: 0.8,
        name: `clipart_${name}_${Date.now()}`,
      });
      fabricRef.current.add(group);
      fabricRef.current.setActiveObject(group);
      fabricRef.current.renderAll();
      URL.revokeObjectURL(url);
    });
  }, []);

  // ── Upload image ───────────────────────────────────────────────────────────

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current || !fabricLibRef.current) return;

    const fabric = fabricLibRef.current;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      if (file.type === 'image/svg+xml') {
        fabric.loadSVGFromURL(dataUrl, (objects: FabricLib[], options: FabricLib) => {
          const group = fabric.util.groupSVGElements(objects, options);
          const maxW = PRINT_AREA.width * 0.8;
          const maxH = PRINT_AREA.height * 0.8;
          const scale = Math.min(maxW / (group.width ?? maxW), maxH / (group.height ?? maxH), 1);
          group.set({
            left: PRINT_AREA.left + PRINT_AREA.width / 2,
            top: PRINT_AREA.top + PRINT_AREA.height / 2,
            originX: 'center', originY: 'center',
            scaleX: scale, scaleY: scale,
            name: `upload_${Date.now()}`,
          });
          fabricRef.current.add(group);
          fabricRef.current.setActiveObject(group);
          fabricRef.current.renderAll();
        });
      } else {
        fabric.Image.fromURL(dataUrl, (img: FabricLib) => {
          const maxW = PRINT_AREA.width * 0.8;
          const maxH = PRINT_AREA.height * 0.8;
          const scale = Math.min(maxW / (img.width ?? maxW), maxH / (img.height ?? maxH), 1);
          img.set({
            left: PRINT_AREA.left + PRINT_AREA.width / 2,
            top: PRINT_AREA.top + PRINT_AREA.height / 2,
            originX: 'center', originY: 'center',
            scaleX: scale, scaleY: scale,
            name: `upload_${Date.now()}`,
          });
          fabricRef.current.add(img);
          fabricRef.current.setActiveObject(img);
          fabricRef.current.renderAll();
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  // ── AI generation ──────────────────────────────────────────────────────────

  const handleAiGenerate = useCallback(async () => {
    if (!aiPrompt.trim() || !fabricRef.current || !fabricLibRef.current) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/design/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const imageUrl: string = data.imageUrl ?? data.url;
      const fabric = fabricLibRef.current;
      fabric.Image.fromURL(imageUrl, (img: FabricLib) => {
        const maxW = PRINT_AREA.width * 0.8;
        const maxH = PRINT_AREA.height * 0.8;
        const scale = Math.min(maxW / (img.width ?? maxW), maxH / (img.height ?? maxH), 1);
        img.set({
          left: PRINT_AREA.left + PRINT_AREA.width / 2,
          top: PRINT_AREA.top + PRINT_AREA.height / 2,
          originX: 'center', originY: 'center',
          scaleX: scale, scaleY: scale,
          name: `ai_${Date.now()}`,
        });
        fabricRef.current.add(img);
        fabricRef.current.setActiveObject(img);
        fabricRef.current.renderAll();
      }, { crossOrigin: 'anonymous' });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt]);

  // ── Add to cart ────────────────────────────────────────────────────────────

  const handleAddToCart = useCallback(async () => {
    if (!fabricRef.current) return;
    setAddingToCart(true);
    try {
      // Hide print area overlay, export, restore
      const printAreaObj = fabricRef.current.getObjects().find((o: FabricLib) => o.name === '__printArea');
      if (printAreaObj) printAreaObj.set('opacity', 0);
      fabricRef.current.renderAll();

      const dataUrl: string = fabricRef.current.toDataURL({
        format: 'png',
        multiplier: 2,
        quality: 1,
      });

      if (printAreaObj) printAreaObj.set('opacity', 1);
      fabricRef.current.renderAll();

      const designJson = JSON.stringify(
        fabricRef.current.toJSON(['name', 'excludeFromExport'])
      );

      addItem({
        product,
        color: selectedColor || product.colors[0]?.name || '',
        size: selectedSize,
        quantity: 1,
        designJson,
        designPreviewUrl: dataUrl,
        unitPrice: product.priceBase,
        printPrice: 3.5,
      });

      openCart();
    } finally {
      setAddingToCart(false);
    }
  }, [product, selectedColor, selectedSize, addItem, openCart]);

  // ── Save design ────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!fabricRef.current) return;
    setSaving(true);
    try {
      const json = JSON.stringify(fabricRef.current.toJSON(['name', 'excludeFromExport']));
      saveCanvasState(json);
      // TODO: persist to API endpoint
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setSaving(false);
    }
  }, [saveCanvasState]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); handleRedo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); handleDeleteSelected(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo, handleDeleteSelected]);

  // ── Clipart categories ─────────────────────────────────────────────────────
  const clipartCategories = [...new Set(clipartLibrary.map((c) => c.category))];
  const [activeClipartCategory, setActiveClipartCategory] = useState(clipartCategories[0] ?? '');
  const filteredClipart = activeClipartCategory
    ? clipartLibrary.filter((c) => c.category === activeClipartCategory)
    : clipartLibrary;

  // ── Computed ───────────────────────────────────────────────────────────────

  const canUndoVal = undoStack.length > 0;
  const canRedoVal = redoStack.length > 0;

  // Toggle panel: clicking the active tool again collapses
  const handleToolClick = useCallback((panel: typeof activePanel) => {
    setActivePanel(activePanel === panel ? null : panel);
  }, [activePanel, setActivePanel]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#0f172a]">

      {/* ── Top bar ── */}
      <div className="bg-[#0f172a] border-b border-slate-700 px-4 h-12 flex items-center gap-3 shrink-0">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded px-1 py-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">Back</span>
        </button>

        {/* Product name */}
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <h1 className="text-white font-medium text-sm truncate">{product.name}</h1>
          <span className="text-slate-500 text-xs hidden sm:inline shrink-0">{product.styleNumber}</span>
        </div>

        {/* Size selector */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-slate-500">Size:</span>
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {product.sizes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Undo / Redo / Clear */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndoVal}
            title="Undo (Cmd+Z)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedoVal}
            title="Redo (Cmd+Y)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            title="Clear all"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 border border-slate-600 text-slate-300 hover:bg-slate-800 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Save</span>
        </button>

        {/* Add to cart */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={addingToCart}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg px-4 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          {addingToCart ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ShoppingCart className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Add to Cart</span>
        </button>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── ICON RAIL (56px) ─── */}
        <div className="w-14 bg-[#0f172a] border-r border-slate-700 flex flex-col shrink-0">
          <PanelButton
            active={activePanel === 'text'}
            onClick={() => handleToolClick('text')}
            icon={<Type className="w-full h-full" />}
            label="Text"
          />
          <PanelButton
            active={activePanel === 'clipart'}
            onClick={() => handleToolClick('clipart')}
            icon={<Palette className="w-full h-full" />}
            label="Art"
          />
          <PanelButton
            active={activePanel === 'upload'}
            onClick={() => handleToolClick('upload')}
            icon={<Upload className="w-full h-full" />}
            label="Upload"
          />
          <PanelButton
            active={activePanel === 'ai'}
            onClick={() => handleToolClick('ai')}
            icon={<Wand2 className="w-full h-full" />}
            label="AI"
          />
        </div>

        {/* ─── TOOL OPTIONS PANEL (w-52, conditionally visible) ─── */}
        {activePanel && (
          <div className="w-52 bg-[#1e293b] border-r border-slate-700 flex flex-col shrink-0 overflow-y-auto">
            <div className="flex-1 overflow-y-auto p-3 space-y-4">

              {/* ── TEXT PANEL ── */}
              {activePanel === 'text' && (
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pt-1">Text Tool</p>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Text</label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      rows={2}
                      placeholder="Enter text..."
                      className="w-full text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Font</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => {
                        setFontFamily(e.target.value);
                        updateSelectedText({ fontFamily: e.target.value });
                      }}
                      className="w-full text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      {FONT_FAMILIES.map((f) => (
                        <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Size: <span className="text-slate-200">{fontSize}px</span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={120}
                      value={fontSize}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setFontSize(v);
                        updateSelectedText({ fontSize: v });
                      }}
                      className="w-full accent-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Color</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {CATEGORY_COLORS.map((c) => (
                        <ColorSwatch
                          key={c}
                          color={c}
                          size="sm"
                          selected={textColor === c}
                          onClick={() => {
                            setTextColor(c);
                            updateSelectedText({ fill: c });
                          }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => {
                        setTextColor(e.target.value);
                        updateSelectedText({ fill: e.target.value });
                      }}
                      className="w-full h-8 rounded-lg border border-slate-600 cursor-pointer bg-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Style</label>
                    <div className="flex gap-1">
                      {[
                        { Icon: Bold, active: isBold, toggle: () => { setIsBold((b) => !b); updateSelectedText({ fontWeight: !isBold ? 'bold' : 'normal' }); }, label: 'Bold' },
                        { Icon: Italic, active: isItalic, toggle: () => { setIsItalic((b) => !b); updateSelectedText({ fontStyle: !isItalic ? 'italic' : 'normal' }); }, label: 'Italic' },
                        { Icon: Underline, active: isUnderline, toggle: () => { setIsUnderline((b) => !b); updateSelectedText({ underline: !isUnderline }); }, label: 'Underline' },
                      ].map(({ Icon, active, toggle, label }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={toggle}
                          title={label}
                          className={`flex-1 py-1.5 rounded-lg text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                            active
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Align</label>
                    <div className="flex gap-1">
                      {[
                        { Icon: AlignLeft, val: 'left' as const },
                        { Icon: AlignCenter, val: 'center' as const },
                        { Icon: AlignRight, val: 'right' as const },
                      ].map(({ Icon, val }) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setTextAlign(val);
                            updateSelectedText({ textAlign: val });
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                            textAlign === val
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addText}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    + Add Text
                  </button>
                </div>
              )}

              {/* ── CLIPART PANEL ── */}
              {activePanel === 'clipart' && (
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pt-1">Clipart</p>
                  <p className="text-xs text-slate-400">Click a clipart to add it to your design.</p>

                  {/* Category filter */}
                  <div className="flex flex-wrap gap-1">
                    {clipartCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveClipartCategory(cat)}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 ${
                          activeClipartCategory === cat
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {filteredClipart.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addClipart(item.svgContent, item.name)}
                        title={item.name}
                        className="aspect-square bg-slate-700 rounded-xl p-2 hover:bg-slate-600 hover:ring-1 hover:ring-emerald-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <div
                          className="w-full h-full"
                          // eslint-disable-next-line react/no-danger
                          dangerouslySetInnerHTML={{ __html: item.svgContent }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── UPLOAD PANEL ── */}
              {activePanel === 'upload' && (
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pt-1">Upload Image</p>
                  <p className="text-xs text-slate-400">
                    Upload a PNG, JPG, or SVG file to use in your design.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-slate-500 hover:border-emerald-400 rounded-xl flex flex-col items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
                  >
                    <Upload className="w-8 h-8" />
                    <span className="font-medium">Click to Upload</span>
                    <span className="text-xs">PNG, JPG, SVG</span>
                  </button>
                  <p className="text-[11px] text-slate-500 text-center">
                    For best print results, use high-resolution images (300 DPI+).
                  </p>
                </div>
              )}

              {/* ── AI PANEL ── */}
              {activePanel === 'ai' && (
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pt-1">AI Art</p>
                  {!aiEnabled ? (
                    <div className="text-center py-6">
                      <Wand2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-200 mb-1">Coming Soon</p>
                      <p className="text-xs text-slate-400">
                        AI-generated artwork will be available soon. Stay tuned!
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Describe your design
                        </label>
                        <textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          rows={4}
                          placeholder="e.g. A fierce eagle with flames, vintage style, t-shirt graphic"
                          className="w-full text-sm bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-slate-500"
                        />
                      </div>

                      {aiError && (
                        <p className="text-xs text-red-400 bg-red-900/30 border border-red-900/50 px-3 py-2 rounded-lg">
                          {aiError}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={handleAiGenerate}
                        disabled={aiLoading || !aiPrompt.trim()}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            Generate Art
                          </>
                        )}
                      </button>

                      <p className="text-[11px] text-slate-500 text-center">
                        Powered by OpenAI DALL-E. Results may take 15-30 seconds.
                      </p>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* ─── CENTER: CANVAS AREA ─── */}
        <div className="flex-1 flex flex-col items-center overflow-auto bg-[#0f172a] p-6 gap-4">

          {/* View switcher pills */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-1 flex items-center gap-0.5">
            {(['front', 'back', 'left', 'right'] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setSelectedView(view)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  selectedView === view
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {VIEW_LABELS[view]}
              </button>
            ))}
          </div>

          {/* Canvas card - white against dark for maximum contrast */}
          <div
            ref={containerRef}
            className="relative w-full max-w-[800px] bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
          >
            {/* Garment image layer */}
            {garmentImageSrc && (
              <div className="absolute inset-0">
                <Image
                  src={garmentImageSrc}
                  alt={`${product.name} ${selectedView}`}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 800px) 100vw, 800px"
                  priority
                  unoptimized
                />
              </div>
            )}

            {/* Fabric canvas overlay */}
            <div className="absolute inset-0">
              <canvas ref={canvasElRef} />
            </div>

            {/* Loading overlay */}
            {!fabricReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Hint row below canvas */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {selectedObject ? (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-900/30 border border-red-900/50 transition-colors text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected
              </button>
            ) : null}
            <span className="hidden sm:block">
              Click elements to select &bull; Drag to move &bull; Corner handles to resize
            </span>
          </div>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="w-52 bg-white border-l border-slate-100 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-3 border-b border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Garment Options
            </p>
          </div>

          <div className="p-3 space-y-5 flex-1 overflow-y-auto">

            {/* Color picker */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    title={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-6 h-6 rounded-full border-2 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 ${
                      selectedColor === color.name
                        ? 'border-emerald-400 scale-110 shadow-md ring-2 ring-emerald-400 ring-offset-1'
                        : 'border-white shadow-[0_0_0_1px_#e5e7eb] hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                {selectedColor || product.colors[0]?.name}
              </p>
            </div>

            {/* Size picker */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Size</p>
              <div className="flex flex-wrap gap-1.5">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      selectedSize === s
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'border-slate-200 text-slate-500 hover:border-slate-900 hover:text-slate-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Object properties (when selected) */}
            {selectedObject && (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Selected: <span className="text-emerald-500 normal-case font-normal">{selectedObject.type}</span>
                </p>

                {selectedObject.type === 'i-text' && (
                  <>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Fill Color</label>
                      <input
                        type="color"
                        defaultValue={selectedObject.fill ?? '#000000'}
                        onChange={(e) => updateSelectedText({ fill: e.target.value })}
                        className="w-full h-8 rounded-lg border border-slate-200 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Opacity: <span className="text-slate-700">{Math.round((selectedObject.opacity ?? 1) * 100)}%</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        defaultValue={selectedObject.opacity ?? 1}
                        onChange={(e) => {
                          updateSelectedText({ opacity: Number(e.target.value) });
                        }}
                        className="w-full accent-emerald-400"
                      />
                    </div>
                  </>
                )}

                {(selectedObject.type === 'image' || selectedObject.type === 'group') && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Opacity: <span className="text-slate-700">{Math.round((selectedObject.opacity ?? 1) * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      defaultValue={selectedObject.opacity ?? 1}
                      onChange={(e) => {
                        if (fabricRef.current) {
                          const active = fabricRef.current.getActiveObject();
                          if (active) {
                            active.set('opacity', Number(e.target.value));
                            fabricRef.current.renderAll();
                          }
                        }
                      }}
                      className="w-full accent-emerald-400"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="w-full py-2 rounded-xl bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 transition-colors border border-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Remove Element
                </button>
              </div>
            )}

            {/* Price breakdown */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Pricing</p>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Garment</span>
                  <span className="text-slate-700 text-xs">${product.priceBase.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Print</span>
                  <span className="text-slate-700 text-xs">$3.50</span>
                </div>
                <div className="flex items-center justify-between border-t border-emerald-100 pt-1.5 mt-1">
                  <span className="text-slate-500 text-xs font-medium">Total / ea</span>
                  <span className="text-slate-900 font-semibold text-sm">
                    ${(product.priceBase + 3.5).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Print area info */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Print Area</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Keep your design within the teal dashed border for best print results.
                Standard print area: ~10&Prime; &times; 12&Prime;.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
