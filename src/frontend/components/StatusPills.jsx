import { useState } from "react";

const C = {
  surface: "#ffffff",
  border: "#e8eaed",
  text: "#1a1d23",
  textMid: "#5f6773",
  textDim: "#9ca3ae",
  green: "#16a34a",
  greenBg: "#f0fdf4",
  yellow: "#d97706",
  yellowBg: "#fffbeb",
  red: "#dc2626",
  redBg: "#fef2f2",
  blue: "#2563eb",
  blueBg: "#eff6ff",
  purple: "#7c3aed",
  purpleBg: "#f5f3ff",
  cyan: "#0891b2",
  cyanBg: "#ecfeff",
};

const FONT = "-apple-system, 'SF Pro Display', 'Segoe UI', sans-serif";

const statusConfig = {
  available: { label: "Disponível", color: C.green, bg: C.greenBg },
  reserved: { label: "Reservado", color: C.yellow, bg: C.yellowBg },
  sold: { label: "Vendido", color: C.blue, bg: C.blueBg },
  negotiation: { label: "Negociação", color: C.purple, bg: C.purpleBg },
  maintenance: { label: "Recondicionamento", color: C.red, bg: C.redBg },
  transit: { label: "Em Trânsito", color: C.cyan, bg: C.cyanBg },
};

function StatusPill({ status, isActive, onClick, disabled }) {
  const config = statusConfig[status] || statusConfig.available;
  const style = {
    padding: "8px 16px",
    borderRadius: 20,
    border: isActive ? `2px solid ${config.color}` : `1px solid ${C.border}`,
    background: isActive ? config.bg : C.surface,
    cursor: disabled ? "default" : "pointer",
    fontSize: 13,
    fontWeight: isActive ? 600 : 500,
    color: isActive ? config.color : C.textMid,
    fontFamily: FONT,
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: 6,
    opacity: disabled ? 0.5 : 1,
  };

  if (!isActive) {
    style.opacity = 0.7;
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!isActive && !disabled) {
          e.target.style.background = config.bg;
          e.target.style.borderColor = config.color;
          e.target.style.opacity = "1";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive && !disabled) {
          e.target.style.background = C.surface;
          e.target.style.borderColor = C.border;
          e.target.style.opacity = "0.7";
        }
      }}
      style={style}
    >
      {isActive && "✓"}
      {config.label}
    </button>
  );
}

function StatusMetadata({ vehicle }) {
  if (!vehicle.statusChangedAt || !vehicle.statusChangedBy) {
    return null;
  }

  const date = new Date(vehicle.statusChangedAt);
  const formattedDate = date.toLocaleDateString("pt-BR") + " " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.textDim }}>
      <div>Status: <strong>{statusConfig[vehicle.status]?.label || "---"}</strong></div>
      <div style={{ marginTop: 4 }}>Última alteração: {formattedDate} por {vehicle.statusChangedBy}</div>
    </div>
  );
}

function StatusPillGroup({ vehicle, onStatusChange, loading = false }) {
  const [showConfirm, setShowConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleStatusClick = (newStatus) => {
    if (newStatus === vehicle.status) return;
    setShowConfirm(newStatus);
  };

  const confirmChange = async () => {
    if (!showConfirm) return;

    setConfirmLoading(true);
    try {
      await onStatusChange(showConfirm);
      setShowConfirm(null);
    } catch (err) {
      console.error("Erro ao mudar status:", err);
      alert("Erro ao mudar status. Tente novamente.");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, display: "block", fontWeight: 600 }}>
          Status do Veículo
        </label>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(statusConfig).map(([statusKey, config]) => (
            <StatusPill
              key={statusKey}
              status={statusKey}
              isActive={vehicle.status === statusKey}
              onClick={() => handleStatusClick(statusKey)}
              disabled={loading || confirmLoading}
            />
          ))}
        </div>

        <StatusMetadata vehicle={vehicle} />
      </div>

      {/* Modal de Confirmação */}
      {showConfirm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          fontFamily: FONT,
        }}>
          <div style={{
            background: C.surface,
            borderRadius: 12,
            padding: 24,
            maxWidth: 380,
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: C.text }}>
                Confirmar Mudança de Status
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
                Deseja mudar de <strong>{statusConfig[vehicle.status]?.label || "---"}</strong> para <strong>{statusConfig[showConfirm]?.label || "---"}</strong>?
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowConfirm(null)}
                disabled={confirmLoading}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: "#f3f4f6",
                  color: C.textMid,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: confirmLoading ? "default" : "pointer",
                  opacity: confirmLoading ? 0.6 : 1,
                  fontFamily: FONT,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmChange}
                disabled={confirmLoading}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: statusConfig[showConfirm]?.color || C.blue,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: confirmLoading ? "default" : "pointer",
                  opacity: confirmLoading ? 0.7 : 1,
                  fontFamily: FONT,
                }}
              >
                {confirmLoading ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { StatusPillGroup, StatusPill, StatusMetadata, statusConfig };
