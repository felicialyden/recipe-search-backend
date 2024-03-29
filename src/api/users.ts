import { Router } from "express";
import prisma from "../prisma";
import { createClient } from "@supabase/supabase-js";

const router = Router();
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
process.env.NODE_TLS_REJECT_UNAUTHORIZED;
const supabase = createClient(supabaseUrl, supabaseKey);

router.get("/:id", async (req, res, next) => {
  const userId = Number(req.params.id);
  try {
    const response = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!response) {
      throw Error("User does not exist");
    }
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const userId = req.params.id;
  const serviceRole = createClient(supabaseUrl, supabaseServiceRoleKey);
  try {
    const { data, error } = await serviceRole.auth.admin.deleteUser(userId);
    if (error) {
      throw Error(error.message);
    }
    await prisma.$transaction([
      prisma.saved.deleteMany({ where: { userId } }),
      prisma.pinned.deleteMany({ where: { userId } }),
    ])
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      throw Error(error.message);
    }
    res.json(data.user?.id);
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw Error(error.message);
    }
    res.json(data.user?.id);
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw Error(error.message);
    }
    res.json("user signed out");
  } catch (error) {
    next(error);
  }
});

router.put("/password", async (req, res, next) => {
  const { password, newPassword } = req.body;
  try {
    const { error } = await supabase.rpc("change_user_password", {
      current_plain_password: password,
      new_plain_password: newPassword,
    });
    if (error) {
      throw Error(error.message);
    }
    res.json("password changed");
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  const { email } = req.body;
  try {
    const { error } = await supabase.auth
    .resetPasswordForEmail(email, {redirectTo: 'https://felicialyden.github.io/recipe-search-frontend/#/reset-password'})
    if (error) {
      throw Error(error.message);
    }
    res.json('Password email sent');
  } catch (error) {
    console.log(error)
    next(error);
  }
});

router.put("/reset-password", async (req, res, next) => {
  const { newPassword } = req.body;
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) {
      throw Error(error.message);
    }
    res.json(data);
  } catch (error) {
    console.log(error)
    next(error);
  }
});

router.get("/:id/saved", async (req, res, next) => {
  const userId = req.params.id;
  try {
    const response = await prisma.saved.findMany({
      where: { userId: userId },
    });
    if (!response) {
      throw Error("No saved recipes");
    }
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/saved", async (req, res, next) => {
  const userId = req.params.id;
  const { id, title, image } = req.body;

  try {
    const response = await prisma.saved.create({
      data: {
        recipeId: id,
        title,
        image,
        userId,
      },
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/saved", async (req, res, next) => {
  const userId = req.params.id;
  const { id } = req.body;
  try {
    const response = await prisma.saved.delete({
      where: {
        id,
        userId,
      },
    });
    if (!response) throw Error("Unauthorized to delete");
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/pinned", async (req, res, next) => {
  const userId = req.params.id;
  try {
    const response = await prisma.pinned.findMany({
      where: { userId: userId },
    });
    if (!response) {
      throw Error("No pinned recipes");
    }
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/pinned", async (req, res, next) => {
  const userId = req.params.id;
  const { id, title, image } = req.body;

  try {
    const response = await prisma.pinned.create({
      data: {
        recipeId: id,
        title,
        image,
        userId,
      },
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/pinned", async (req, res, next) => {
  const userId = req.params.id;
  const { id } = req.body;
  try {
    const response = await prisma.pinned.delete({
      where: {
        id,
        userId,
      },
    });
    if (!response) throw Error("Unauthorized to delete");
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default {
  router,
};
