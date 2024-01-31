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

const users = {
  akbar: {
    username: "akbar",
    password: "$2b$10$bWb8TwhFMMQG6HMnbtDwzeqFOZqGZqp6Ge3sEjsx7wbZro2F6m3De",
    name: "akbar",
    id: 1,
  },
};

const validate = async (request, username, password) => {
  const user = users[username];
  if (!user) {
    throw Boom.unauthorized("Authentiction filed");
  }

  const isValid = await bcrypt.compare(password, user.password);
  const credentials = { id: user.id, name: user.name };

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
        return "hello world";
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
          const { password } = request.params;
          const salt = await bcrypt.genSalt(10);
          const generatePassword = await bcrypt.hash(password, salt);
          return generatePassword;
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
