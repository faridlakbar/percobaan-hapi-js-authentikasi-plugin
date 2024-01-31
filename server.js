import Hapi from "@hapi/hapi";
import bcrypt from "bcrypt";
import Boom from "@hapi/boom";
import basic from "@hapi/basic";
import inert from "@hapi/inert";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

// get path and dirname
import { fileURLToPath } from "url";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = createClient({
  url: "libsql://simpledatabase-faridlakbar.turso.io",
  authToken: process.env.KEYAUTH,
});

const validate = async (request, username, password) => {
  const user = await client.execute({
    sql: `
    SELECT * FROM users WHERE username = ?
  `,
    args: [username],
  });
  if (!user.rows.length) {
    throw Boom.unauthorized("Authentiction filed");
  }

  const isValid = await bcrypt.compare(password, user.rows[0].password);
  const credentials = { id: user.rows[0].id, name: user.rows[0].name };

  return { credentials, isValid };
};

async function init() {
  const server = new Hapi.server({
    host: "localhost",
    port: 9000,
    routes: {
      files: { relativeTo: path.join(__dirname, "public") },
    },
  });

  await server.register(basic);
  await server.register(inert);

  server.auth.strategy("simple", "basic", { validate });

  server.route([
    {
      method: "GET",
      path: "/",
      options: {
        auth: "simple",
      },
      handler: (request, h) => {
        return "hello world!";
      },
    },
    {
      method: "GET",
      path: "/register/{param*}",
      handler: {
        directory: {
          path: "./register",
          redirectToSlash: true,
          index: ["register.html"],
        },
      },
    },
    {
      method: "GET",
      path: "/register/",
      handler: (request, h) => {
        return h.redirect("/register");
      },
    },
    {
      method: "POST",
      path: "/register",
      handler: async (request, h) => {
        try {
          const result = request.payload;
          const salt = await bcrypt.genSalt(10);
          const hashPassword = await bcrypt.hash(result.password, salt);
          await client.execute({
            sql: `INSERT INTO users (username, name, password) VALUES (?,?,?)`,
            args: [result.username, result.name, hashPassword],
          });
          const data = await client.execute({
            sql: `SELECT * FROM users WHERE username=?`,
            args: [result.username],
          });
          if (!data.rows.length) throw new Error("data not fount");
          return h.response({ result: "berhasil" }).code(200);
        } catch (error) {
          throw Boom.internal("Internal Server Error");
        }
      },
    },
    {
      method: "GET",
      path: "/basic",
      options: {
        auth: "simple",
      },
      handler: async (request, h) => {
        try {
          return h.file("./package.json");
        } catch (error) {
          throw Boom.internal("Internl Server Error");
        }
      },
    },
  ]);

  await server.start();
  console.log(`server berjalan pada port 9000`);
}

process.on("unhandledRejection", (error) => {
  console.log(error);
  process.exit(1);
});

init();
