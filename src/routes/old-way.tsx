import OldWayDemo from "~/components/OldWayDemo"

export default function OldWayPage() {
  return (
    <>
      <OldWayDemo />
      
      {/* Navigation back to HydraJTS */}
      <div style={{
        "text-align": "center",
        "margin": "3rem 0",
        "padding": "2rem",
        "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "border-radius": "16px",
        "max-width": "1200px",
        "margin-left": "auto",
        "margin-right": "auto"
      }}>
        <h2 style={{ "color": "white", "margin-bottom": "1rem" }}>
          Experience the Difference with HydraJTS
        </h2>
        <p style={{ "color": "rgba(255,255,255,0.9)", "margin-bottom": "2rem" }}>
          Never block your UI again with parallel proof generation
        </p>
        <a 
          href="/"
          style={{
            "display": "inline-block",
            "padding": "1rem 2rem",
            "background": "white",
            "color": "#667eea",
            "border-radius": "8px",
            "text-decoration": "none",
            "font-weight": "600",
            "font-size": "1.1rem",
            "transition": "transform 0.3s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          🦑 Try HydraJTS Instead
        </a>
      </div>
    </>
  )
}
