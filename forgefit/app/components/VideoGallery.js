"use client";
import { useState, useRef, useEffect } from "react";

const VIDEOS = [
  { src: "/videos/v2.mp4" },
  { src: "/videos/v3.mp4" },
  { src: "/videos/v4.mp4" },
  { src: "/videos/v5.mp4" },
  { src: "/videos/v6.mp4" },
  { src: "/videos/v7.mp4" },
  { src: "/videos/v8.mp4" },
  { src: "/videos/v9.mp4" },
];

export default function VideoGallery() {
  const [active, setActive] = useState(null);
  const [current, setCurrent] = useState(0);
  const videoRefs = useRef([]);
  const modalRef = useRef(null);

  const prev = () => setCurrent(c => (c - 1 + VIDEOS.length) % VIDEOS.length);
  const next = () => setCurrent(c => (c + 1) % VIDEOS.length);

  useEffect(() => {
    const onKey = e => {
      if (active === null) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const visible = [
    (current - 1 + VIDEOS.length) % VIDEOS.length,
    current,
    (current + 1) % VIDEOS.length,
    (current + 2) % VIDEOS.length,
  ];

  return (
    <>
    <style>{`
      .vg-card{position:relative;overflow:hidden;cursor:pointer;background:#111;border:0.5px solid #242424;transition:transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s,border-color .3s}
      .vg-card:hover{transform:translateY(-6px) scale(1.02);box-shadow:0 20px 50px rgba(0,0,0,.6),0 0 0 1px rgba(201,168,76,.2);border-color:rgba(201,168,76,.3)}
      .vg-card video{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s}
      .vg-card:hover video{transform:scale(1.05)}
      .vg-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 60%);opacity:0;transition:opacity .3s;display:flex;align-items:center;justify-content:center}
      .vg-card:hover .vg-overlay{opacity:1}
      .vg-play{width:52px;height:52px;border-radius:50%;border:2px solid #C9A84C;display:flex;align-items:center;justify-content:center;color:#C9A84C;font-size:18px;transition:all .3s;backdrop-filter:blur(4px)}
      .vg-card:hover .vg-play{transform:scale(1.1);background:rgba(201,168,76,.15)}
      .vg-nav{width:44px;height:44px;border-radius:50%;border:0.5px solid #242424;background:rgba(10,10,10,.8);color:#555;font-size:18px;cursor:pointer;transition:all .3s;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)}
      .vg-nav:hover{border-color:#C9A84C;color:#C9A84C;transform:scale(1.1)}
      .vg-dot{width:6px;height:6px;border-radius:50%;background:#242424;cursor:pointer;transition:all .3s}
      .vg-dot.active{background:#C9A84C;width:18px;border-radius:3px}
      .vg-modal{position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:999;display:flex;align-items:center;justify-content:center;padding:2rem}
      .vg-modal video{max-width:100%;max-height:85vh;border:0.5px solid #242424;box-shadow:0 0 80px rgba(201,168,76,.1)}
      .vg-modal-close{position:absolute;top:20px;right:24px;background:none;border:none;color:#555;font-size:28px;cursor:pointer;transition:color .2s;line-height:1}
      .vg-modal-close:hover{color:#C9A84C}
      .vg-modal-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(10,10,10,.7);border:0.5px solid #242424;color:#555;font-size:22px;cursor:pointer;padding:12px 16px;transition:all .3s;backdrop-filter:blur(8px)}
      .vg-modal-nav:hover{border-color:#C9A84C;color:#C9A84C}
      @media(max-width:768px){.vg-grid{grid-template-columns:1fr 1fr !important}}
    `}</style>

    <section style={{padding:"4rem 3rem",borderBottom:"0.5px solid #242424",background:"#080808"}}>
      <div style={{textAlign:"center",marginBottom:"3rem"}}>
        <div style={{fontSize:11,letterSpacing:"4px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"0.5rem"}}>— En action</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:44,fontWeight:600,lineHeight:1}}>
          L'entraînement,<br/><em style={{fontStyle:"italic",color:"#555"}}>tel qu'il devrait être</em>
        </div>
      </div>

      {/* Carousel visible */}
      <div style={{position:"relative"}}>
        <div className="vg-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"#242424",marginBottom:"1.5rem"}}>
          {visible.map((idx, pos) => (
            <div key={`${idx}-${pos}`} className="vg-card" style={{height:220}} onClick={() => { setActive(idx); setCurrent(idx); }}>
              <video
                ref={el => videoRefs.current[idx] = el}
                src={VIDEOS[idx].src}
                muted autoPlay loop playsInline
                preload={pos === 1 ? "auto" : "none"}
                style={{width:"100%",height:"100%",objectFit:"cover"}}
              />
              <div className="vg-overlay">
                <div className="vg-play">▶</div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"1rem"}}>
          <button className="vg-nav" onClick={prev}>‹</button>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {VIDEOS.map((_,i) => (
              <div key={i} className={`vg-dot${i===current?" active":""}`} onClick={() => setCurrent(i)}/>
            ))}
          </div>
          <button className="vg-nav" onClick={next}>›</button>
        </div>
      </div>
    </section>

    {/* Modal plein écran */}
    {active !== null && (
      <div className="vg-modal" onClick={e => { if(e.target === e.currentTarget) setActive(null); }}>
        <button className="vg-modal-close" onClick={() => setActive(null)}>×</button>
        <button className="vg-modal-nav" style={{left:16}} onClick={(e) => { e.stopPropagation(); const n=(current-1+VIDEOS.length)%VIDEOS.length; setCurrent(n); setActive(n); }}>‹</button>
        <video
          key={active}
          src={VIDEOS[active].src}
          controls autoPlay
          style={{maxWidth:"100%",maxHeight:"85vh",border:"0.5px solid #242424",boxShadow:"0 0 80px rgba(201,168,76,.1)"}}
        />
        <button className="vg-modal-nav" style={{right:16}} onClick={(e) => { e.stopPropagation(); const n=(current+1)%VIDEOS.length; setCurrent(n); setActive(n); }}>›</button>
      </div>
    )}
    </>
  );
}
