import { useState, useMemo } from "react";

const C = {
  surface: "#ffffff",
  surfaceAlt: "#f9fafb",
  border: "#e8eaed",
  borderLight: "#f0f1f3",
  text: "#1a1d23",
  textMid: "#5f6773",
  textDim: "#9ca3ae",
  red: "#dc2626",
  redBg: "#fef2f2",
  green: "#16a34a",
  accent: "#1d4ed8",
  accentLight: "#eff6ff",
};

const FONT = "-apple-system, 'SF Pro Display', 'Segoe UI', sans-serif";

const PREDEFINED_CATEGORIES = [
  "Compra do veiculo",
  "Funilaria",
  "Martelinho",
  "Documentacao",
  "Comissao",
  "Combustivel",
  "Viagem",
  "Lavagem",
  "Vistoria",
];

function CostCard({ category, value, onEdit, onDelete, editable = true }) {
  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        minWidth: 120,
        gap: 8,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, maxWidth: "100%", wordBreak: "break-word" }}>
        {category}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
        {formattedValue}
      </div>
      {editable && (
        <div style={{ display: "flex", gap: 6, width: "100%" }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              padding: "5px 8px",
              background: C.accentLight,
              color: C.accent,
              border: `1px solid ${C.accent}`,
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            editar
          </button>
          <button
            onClick={onDelete}
            style={{
              flex: 1,
              padding: "5px 8px",
              background: C.redBg,
              color: C.red,
              border: `1px solid ${C.red}`,
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function CostCardEdit({ initialCategory, initialValue, categories, onSave, onCancel }) {
  const [category, setCategory] = useState(initialCategory || "");
  const [value, setValue] = useState(initialValue || 0);
  const [error, setError] = useState("");

  const validate = () => {
    setError("");
    if (!category || category.trim() === "") {
      setError("Categoria é obrigatória");
      return false;
    }
    if (category.length > 50) {
      setError("Categoria não pode ter mais de 50 caracteres");
      return false;
    }
    if (isNaN(value) || value < 0) {
      setError("Valor deve ser um número maior ou igual a 0");
      return false;
    }
    if (value > 10000000) {
      setError("Valor não pode ser maior que R$ 10M");
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(category.trim(), Number(value));
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          background: C.surface,
          borderRadius: 12,
          padding: 24,
          maxWidth: 420,
          width: "90%",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: C.text }}>
          {initialCategory ? "Editar Custo" : "Adicionar Novo Custo"}
        </h3>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 6, fontWeight: 500 }}>
            Categoria
          </label>
          <select
            value={category}
            onChange={(e) => {
              const val = e.target.value;
              setCategory(val);
              if (error) setError("");
            }}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${error ? C.red : C.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontFamily: FONT,
              outline: "none",
              boxSizing: "border-box",
            }}
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="__custom__">Personalizado...</option>
          </select>
          {category === "__custom__" ? (
            <input
              placeholder="Digite uma categoria customizada"
              value=""
              onChange={(e) => {
                setCategory(e.target.value);
                if (error) setError("");
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${error ? C.red : C.border}`,
                borderRadius: 8,
                fontSize: 13,
                fontFamily: FONT,
                outline: "none",
                boxSizing: "border-box",
                marginTop: 6,
              }}
            />
          ) : null}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 6, fontWeight: 500 }}>
            Valor (R$)
          </label>
          <input
            type="number"
            min="0"
            value={value}
            onChange={(e) => {
              setValue(Number(e.target.value) || 0);
              if (error) setError("");
            }}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${error ? C.red : C.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontFamily: FONT,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div style={{ color: C.red, fontSize: 12, marginBottom: 12, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "#f3f4f6",
              color: C.textMid,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!category || isNaN(value) || value < 0}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: C.accent,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: !category || isNaN(value) || value < 0 ? "default" : "pointer",
              opacity: !category || isNaN(value) || value < 0 ? 0.5 : 1,
              fontFamily: FONT,
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function CostsList({ costs, onAddCost, onEditCost, onDeleteCost, onTotalChange }) {
  const [editingCost, setEditingCost] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const totalCosts = useMemo(() => {
    return Object.values(costs || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }, [costs]);

  useMemo(() => {
    if (onTotalChange) {
      onTotalChange(totalCosts);
    }
  }, [totalCosts, onTotalChange]);

  const handleDeleteCost = (category) => {
    if (confirm(`Deletar custo de ${category} (${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(costs[category])})?`)) {
      onDeleteCost(category);
    }
  };

  const handleEditSave = (category, value) => {
    if (editingCost) {
      onEditCost(editingCost, category, value);
    } else {
      onAddCost(category, value);
    }
    setEditingCost(null);
    setShowAddForm(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12, display: "block", fontWeight: 600 }}>
          Custos e Despesas
        </label>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {Object.entries(costs || {}).map(([category, value]) => (
            <CostCard
              key={category}
              category={category}
              value={value}
              onEdit={() => setEditingCost(category)}
              onDelete={() => handleDeleteCost(category)}
              editable={true}
            />
          ))}

          {/* Card especial para adicionar novo custo */}
          <button
            onClick={() => {
              setEditingCost(null);
              setShowAddForm(true);
            }}
            style={{
              background: C.surfaceAlt,
              border: `2px dashed ${C.border}`,
              borderRadius: 12,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minWidth: 120,
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: FONT,
            }}
            onMouseEnter={(e) => {
              e.target.style.background = C.accentLight;
              e.target.style.borderColor = C.accent;
              e.target.style.color = C.accent;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = C.surfaceAlt;
              e.target.style.borderColor = C.border;
              e.target.style.color = C.textDim;
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: C.accent }}>+</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid }}>Adicionar Custo</div>
          </button>
        </div>
      </div>

      {/* Total */}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.textDim, textTransform: "uppercase" }}>
            Total de Custos
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalCosts)}
          </span>
        </div>
      </div>

      {/* Edit Form Modal */}
      {(showAddForm || editingCost) && (
        <CostCardEdit
          initialCategory={editingCost}
          initialValue={editingCost ? costs[editingCost] : 0}
          categories={PREDEFINED_CATEGORIES}
          onSave={handleEditSave}
          onCancel={() => {
            setEditingCost(null);
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
}

export { CostsList, CostCard, CostCardEdit, PREDEFINED_CATEGORIES };
