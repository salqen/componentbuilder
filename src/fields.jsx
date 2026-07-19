// Zdieľané custom fieldy pre Component Registry (MD §4)
export const colorField = (label) => ({
  type: "custom",
  label,
  render: ({ value, onChange }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)}
        style={{ width: 34, height: 28, padding: 0, border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }} />
      <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, fontSize: 13, padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }} />
    </div>
  ),
});

// Image field — URL + živý náhľad (upload do Supabase Storage príde vo Fáze 3)
export const imageField = (label) => ({
  type: "custom",
  label,
  render: ({ value, onChange }) => (
    <div style={{ display: "grid", gap: 6 }}>
      <input type="text" value={value || ""} placeholder="https://… (URL obrázka)"
        onChange={(e) => onChange(e.target.value)}
        style={{ fontSize: 13, padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }} />
      {value ? (
        <img src={value} alt="" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" }}
          onError={(e) => { e.target.style.opacity = 0.25; }} />
      ) : (
        <div style={{ height: 54, borderRadius: 8, border: "1px dashed #ccc", display: "flex", alignItems: "center",
          justifyContent: "center", color: "#999", fontSize: 12 }}>bez obrázka</div>
      )}
    </div>
  ),
});

export const idField = { type: "text", label: "ID sekcie (kotva pre menu)" };
