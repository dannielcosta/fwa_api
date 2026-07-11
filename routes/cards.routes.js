const express = require("express");
const router = express.Router();
const pool = require("../db");
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

const multer = require("multer");
const { storage } = require("../cloudinary"); // importar storage do Cloudinary
const cloudinary = require("cloudinary").v2;
const upload = multer({ storage });
const nodemailer = require("nodemailer");

let coverUrl;

const exportPdf = () => {
  // Lógica para exportar PDF
  console.log("Exportando PDF...");
};

const hasPermission = (req, res, next) => {
  if (!req.payload) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userPayload = req.payload;

  if (req.payload.type === "admin" || req.payload.type === "gestor") {
    next();
  } else {
    res.status(403).json({ message: "Access denied" });
  }
};

//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// USER ROUTES
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET REQUESTS
//
//

// GET /api/cards → lista todos os cartões do user autenticado
router.get("/cards", isAuthenticated, hasPermission, async (req, res, next) => {
  try {
    const userId = req.payload.id;
    const userType = req.payload.type;

    const baseQuery = `
  SELECT 
    bc.*, 
    bcl.review,
    bcl.facebook,
    bcl.website,
    bcl.instagram,
    bcl.linkedin,
    COALESCE(SUM(CAST(crs.total_reads AS SIGNED)), 0) AS total_reads
  FROM business_cards bc
  LEFT JOIN business_cards_links bcl ON bc.id = bcl.business_card_id
  LEFT JOIN card_read_stats crs ON bc.id = crs.card_id
  ${userType === "admin" ? "" : "WHERE bc.owner_id = ?"}
  GROUP BY bc.id, bcl.review, bcl.facebook, bcl.website, bcl.instagram, bcl.linkedin
`;

const [rows] = await pool.query(
  baseQuery,
  userType === "admin" ? [] : [userId]
);

res.json(rows);
  } catch (err) {
    console.error("❌ Erro ao buscar cartões:", err);
    next(err);
  }
});

router.get("/cards/:iD", async (req, res, next) => {
  try {
    const { iD } = req.params;
    const { lat, lon } = req.query; 


    const query = `
  SELECT 
    bc.*, 
    bcl.review,
    bcl.facebook,
    bcl.standvirtual,
    bcl.website,
    bcl.instagram,
    bcl.olx,
    bcl.location,
    bcl.linkedin
  FROM business_cards bc
  LEFT JOIN business_cards_links bcl ON bc.id = bcl.business_card_id
  WHERE bc.id = ?
`;

const [rows] = await pool.query(query, [iD]);

if (rows.length === 0) {
  return res.status(404).json({ message: "Card not found" });
}

const row = rows[0];


    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    await pool.query(`
  INSERT INTO card_read_stats 
  (card_id, year, month, date, total_reads, last_update)
  VALUES (?, YEAR(CURDATE()), MONTH(CURDATE()), CURDATE(), 1, NOW())
  ON DUPLICATE KEY UPDATE
    total_reads = total_reads + 1,
    last_update = NOW()
`, [iD]);


    if (lat && lon) {
      await pool.query(
        `
        INSERT INTO card_location (card_id, latitude, longitude, created_at)
        VALUES (?, ?, ?, NOW())
        `,
        [iD, lat, lon]
      );
    }


    const card = {
      id: row.id,
      type: row.type,
      first_name: row.first_name,
      last_name: row.last_name,
      company: row.company,
      title: row.title,
      phone1: row.phone1,
      phone2: row.phone2,
      email: row.email,
      address: row.address,
      cover: row.cover,
      primary_color: row.primary_color,
      secondary_color: row.secondary_color,
      layout: row.layout,
      owner_id: row.owner_id,
      status: row.status,
      department: row.department,
      links: {
        review: row.review,
        facebook: row.facebook,
        standvirtual: row.standvirtual,
        website: row.website,
        instagram: row.instagram,
        olx: row.olx,
        location: row.location,
        linkedin: row.linkedin,
      },
    };

    res.json(card);
  } catch (err) {
    console.error("❌ Erro ao processar GET /cards/:iD:", err);
    next(err);
  }
});



router.post(
  "/cards",
  isAuthenticated,
  hasPermission,
  async (req, res, next) => {
    try {
      const {
        type,
        first_name,
        last_name,
        company,
        title,
        phone1,
        phone2,
        email,
        address,
        cover,
        links,
        primary_color,
        secondary_color,
        layout,
        department,
        design_mode,
        design_meta,
      } = req.body;

      const status = "pending";
      const ownerId = req.payload.id;
      const newCardId = randomUUID();

      let finalDesignMeta = null;

      if (design_meta) {
        finalDesignMeta =
          typeof design_meta === "string"
            ? JSON.parse(design_meta)
            : design_meta;
      }

      const cardValues = [
        newCardId,
        type,
        first_name,
        last_name,
        company,
        title,
        phone1,
        phone2,
        email,
        address,
        cover,
        primary_color,
        secondary_color,
        layout,
        ownerId,
        status,
        department,
        design_mode,
        finalDesignMeta ? JSON.stringify(finalDesignMeta) : null,
      ];

      const insertCardQuery = `
        INSERT INTO business_cards (
          id, type, first_name, last_name, company, title,
          phone1, phone2, email, address, cover,
          primary_color, secondary_color, layout,
          owner_id, status, department, design_mode, design_meta
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;

      await pool.query(insertCardQuery, cardValues);

      if (links) {
        const {
          review,
          facebook,
          standvirtual,
          website,
          instagram,
          olx,
          location,
          linkedin,
        } = links;

        await pool.query(
          `
          INSERT INTO business_cards_links (
            business_card_id, review, facebook, standvirtual,
            website, instagram, olx, location, linkedin
          ) VALUES (?,?,?,?,?,?,?,?,?)
          `,
          [
            newCardId,
            review ?? null,
            facebook ?? null,
            standvirtual ?? null,
            website ?? null,
            instagram ?? null,
            olx ?? null,
            location ?? null,
            linkedin ?? null,
          ]
        );
      }

      const [rows] = await pool.query(
        "SELECT * FROM business_cards WHERE id = ?",
        [newCardId]
      );

      const newCard = rows[0];

      res.status(201).json(newCard);
    } catch (error) {
      res.status(500).json({ error: error.message });
      next(error);
    }
  }
);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// PUT
//
router.put(
  "/cards/:id",
  isAuthenticated,
  hasPermission,
  async (req, res, next) => {
    const conn = await pool.getConnection();

try {
  await conn.beginTransaction();
 const { id } = req.params;
 const {
  type,
  first_name,
  last_name,
  company,
  title,
  phone1,
  phone2,
  email,
  address,
  cover,
  links,
  primary_color,
  secondary_color,
  layout,
  department,
} = req.body;

const cardValues = [
  type,
  first_name,
  last_name,
  company,
  title,
  phone1,
  phone2,
  email,
  address,
  cover ?? null,
  primary_color,
  secondary_color,
  layout,
  department,
  id,
];

const linkValues = [
  id,
  links?.review ?? null,
  links?.facebook ?? null,
  links?.standvirtual ?? null,
  links?.website ?? null,
  links?.instagram ?? null,
  links?.olx ?? null,
  links?.location ?? null,
  links?.linkedin ?? null,
];
  const [checkRes] = await conn.query(
    "SELECT owner_id FROM business_cards WHERE id = ?",
    [id]
  );

  if (checkRes.length === 0) {
    await conn.rollback();
    return res.status(404).json({ message: "Card not found" });
  }

  const updateCardQuery = `
    UPDATE business_cards
    SET type=?, first_name=?, last_name=?, company=?, title=?,
        phone1=?, phone2=?, email=?, address=?, cover=?,
        primary_color=?, secondary_color=?, layout=?, department=?
    WHERE id=?
  `;

  await conn.query(updateCardQuery, cardValues);

  // UPSERT links (MySQL)
  await conn.query(`
    INSERT INTO business_cards_links (
      business_card_id, review, facebook, standvirtual,
      website, instagram, olx, location, linkedin
    ) VALUES (?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      review=VALUES(review),
      facebook=VALUES(facebook),
      standvirtual=VALUES(standvirtual),
      website=VALUES(website),
      instagram=VALUES(instagram),
      olx=VALUES(olx),
      location=VALUES(location),
      linkedin=VALUES(linkedin)
  `, linkValues);

  await conn.commit();

  res.status(200).json({ message: "Updated" });

} catch (err) {
  await conn.rollback();
  next(err);
} finally {
  conn.release();
}
  }
);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// DELETE
//
router.delete(
  "/cards/:id",
  isAuthenticated,
  hasPermission,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Verifica se existe e de quem é
      const [rows] = await pool.query(
  "SELECT owner_id FROM business_cards WHERE id = ?",
  [id]
);

if (rows.length === 0) {
  return res.status(404).json({ message: "Card not found" });
}

await pool.query("DELETE FROM business_cards WHERE id = ?", [id]);
      res.status(200).json({ message: "This card was deleted" });
    } catch (error) {
      next(error);
    }
  }
);

// IMAGE UPLOAD
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// POST IMAGE
//
// request que edita insere e atualiza a imagem do cartão - COVER

router.post(
  "/upload/image",
  isAuthenticated,
  hasPermission,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file?.path) {
        return res.status(400).json({ message: "Nenhuma imagem enviada" });
      }

      // Upload para o Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);
      const imageUrl = result.secure_url;


      const { cardId } = req.body; // ou req.query.cardId se vier como query parameter

      if (!cardId) {
        return res.status(400).json({ message: "ID do card é obrigatório" });
      }

      // Query para atualizar o campo cover na base de dados
      await pool.query(
  "UPDATE business_cards SET cover = ? WHERE id = ?",
  [imageUrl, cardId]
);

const [rows] = await pool.query(
  "SELECT * FROM business_cards WHERE id = ?",
  [cardId]
);

      

      if (rows.length === 0) {
  return res.status(404).json({ message: "Card não encontrado" });
}

      res.json({
        url: imageUrl,
        card: rows[0],
        message: "Imagem carregada e card atualizado com sucesso",
      });
    } catch (error) {
      console.error("Erro no upload:", error);
      next(error);
    }
  }
);

// PDF CARDS DESIGN
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// PDF SEND
//
// request que edita insere e atualiza a imagem do cartão - COVER

router.post("/send-pdfs", upload.array("pdfs"), async (req, res) => {
  try {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } =
      process.env;

    const data = JSON.parse(req.body.data || "{}");
    const pdfFiles = req.files || [];


    // Cria transporter SMTP (Gmail)
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Email com anexos
    const mailOptions = {
      from: `"NFC-ME" <${EMAIL_FROM}>`,
      to: "suporte@nfc-me.pt",
      subject: `📇 Novo pack de ${pdfFiles.length} cartões - ${
        data.cards?.[0]?.company || "Cliente"
      }`,
      text: "Segue em anexo o pack de cartões criados no checkout.",
      attachments: pdfFiles.map((file) => ({
        filename: file.originalname,
        content: file.buffer,
      })),
    };

    await transporter.sendMail(mailOptions);

    // (Opcional) guardar os dados na BD
    // await Card.bulkCreate(data.cards);

    res.json({ message: "PDFs recebidos e email enviado com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);
    res.status(500).json({ error: "Falha no envio do email" });
  }
});

// POST RECEIVE PDFS

router.post(
  "/cards/print",
  isAuthenticated,
  upload.any(),
  async (req, res) => {
    const cards = [];

    Object.keys(req.body).forEach(key => {
      if (key.startsWith("cards")) {
        const [, index, field] = key.match(/cards\[(\d+)\]\[(\w+)\]/);

        cards[index] ||= {};
        cards[index][field] =
          field === "design"
            ? JSON.parse(req.body[key])
            : req.body[key];
      }
    });

    // req.files contains images
    // Map images → card index
    // Generate PDFs
    // Email printer

    res.json({ success: true });
  }
);

router.post(
  "/cards/upload-design",
  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "back", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      if (!req.files?.front || !req.files?.back) {
        return res.status(400).json({
          message: "Front and back files are required",
        });
      }

      // Upload to Cloudinary
      const frontUpload = await cloudinary.uploader.upload(
        req.files.front[0].path
      );
      const backUpload = await cloudinary.uploader.upload(
        req.files.back[0].path
      );

      res.json({
        frontUrl: frontUpload.secure_url,
        backUrl: backUpload.secure_url,
      });
    } catch (err) {
      console.error("❌ upload-design error:", err);
      next(err);
    }
  }
);


module.exports = router;
