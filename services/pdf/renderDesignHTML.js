
function renderSide(side) {
  const bg = side.backgroundGradient
    ? `linear-gradient(${side.backgroundGradient.angle}deg, ${side.backgroundGradient.from}, ${side.backgroundGradient.to})`
    : side.backgroundColor;

  return `
    <div class="side" style="background:${bg}">
      ${side.elements.map(el => {
        if (el.type === "text") {
          return `
            <div style="
              position:absolute;
              left:${el.x}px;
              top:${el.y}px;
              font-size:${el.fontSize}px;
              font-family:${el.fontFamily};
              color:${el.color};
            ">
              ${el.content}
            </div>
          `;
        }

        if (el.type === "image") {
          return `
            <img src="${el.src}" style="
              position:absolute;
              left:${el.x}px;
              top:${el.y}px;
              width:${el.width}px;
              height:${el.height}px;
            " />
          `;
        }
      }).join("")}
    </div>
  `;
}

function buildHTML(design) {
  return `
    <html>
      <head>
        <style>
          body { margin:0; }
          .page {
            width:340px;
            height:428px;
          }
          .side {
            width:340px;
            height:214px;
            position:relative;
            overflow:hidden;
          }
        </style>
      </head>
      <body>
        <div class="page">
          ${renderSide(design.front)}
          ${renderSide(design.back)}
        </div>
      </body>
    </html>
  `;
}


module.exports = buildHTML;