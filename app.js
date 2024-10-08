const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const { dirname } = require("path");
const {
  loadContact,
  findContact,
  addContact,
  cekDuplikat,
  deleteContact,
  updateContacts,
} = require("./utils/contacts");

const { body, check, validationResult } = require("express-validator");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

const app = express();
const port = 3000;

//gunakkan ejs
app.set("view engine", "ejs");

//Third-party Middleware
app.use(expressLayouts);

//Built in middleware
app.use(express.static("public"));

//url encoded
app.use(express.urlencoded({ extended: true }));

//konfigurasi flash
app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

app.get("/", (req, res) => {
  const mahasiswa = [
    { nama: "Tegar", email: "tegar@gmail.com" },
    { nama: "Galih", email: "galih@gmail.com" },
    { nama: "Doddy", email: "doddy@gmail.com" },
  ];
  res.render("index", {
    nama: "Tegar Panggalih",
    layout: "layouts/main-layouts",
    title: "Halaman Home",
    mahasiswa,
  });
});

//halaman form tambah data
app.get("/contact/add", (req, res) => {
  res.render("add-contact", {
    layout: "layouts/main-layouts",
    title: "Form Tambah Data Contact",
  });
});

//proses data contact
app.post(
  "/contact",
  [
    body("nama").custom((value) => {
      const duplikat = cekDuplikat(value);
      if (duplikat) {
        throw new Error("Nama contact sudah digunakkan!");
      }
      return true;
    }),
    check("email", "Email tidak valid!").isEmail(),
    check("nohp", "Nomor Hp tidak valid!").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("add-contact", {
        title: "Form Tambah Data",
        layout: "layouts/main-layouts",
        errors: errors.array(),
      });
    } else {
      addContact(req.body);
      //kirimkan flash message
      req.flash("msg", "Data contact berhasil ditambahkan!");
      res.redirect("/contact");
    }
  }
);

app.get("/contact", (req, res) => {
  const contacts = loadContact();
  res.render("contact", {
    layout: "layouts/main-layouts",
    title: "Halaman Contact",
    contacts,
    msg: req.flash("msg"),
  });
});

//proses delete contact
app.get("/contact/delete/:nama", (req, res) => {
  const contact = findContact(req.params.nama);

  //jika kontak tidak ada
  if (!contact) {
    res.status(404);
    res.send("<h1>404</h1>");
  } else {
    deleteContact(req.params.nama);
    req.flash("msg", "Data contact berhasil dihapus!");
    res.redirect("/contact");
  }
  });


  //form ubah data contact
  app.get("/contact/edit/:nama", (req, res) => {
    const contact = findContact(req.params.nama)

    res.render("edit-contact", {
      layout: "layouts/main-layouts",
      title: "Form Ubah Data Contact",
      contact
    });
});

//proses ubah data
app.post(
    "/contact/update",
    [
      body("nama").custom((value, {req }) => {
        const duplikat = cekDuplikat(value);
        if (value !== req.body.oldNama && duplikat) {
          throw new Error("Nama contact sudah digunakkan!");
        }
        return true;
      }),
      check("email", "Email tidak valid!").isEmail(),
      check("nohp", "Nomor Hp tidak valid!").isMobilePhone("id-ID"),
    ],
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.render("edit-contact", {
          title: "Form Ubah Data",
          layout: "layouts/main-layouts",
          errors: errors.array(),
          contact: req.body
        });
      } else {
        updateContacts(req.body);
        //kirimkan flash message
        req.flash("msg", "Data contact berhasil di update!");
        res.redirect("/contact");
        
      }
    }
  );



app.get("/contact/:nama", (req, res) => {
  const contact = findContact(req.params.nama);
  res.render("detail", {
    layout: "layouts/main-layouts",
    title: "Halaman Detail Contact",
    contact,
  });
});

app.use("/", (req, res) => {
  res.status(404);
  res.send("<h1>404</h1>");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
