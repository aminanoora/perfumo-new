import cartCount from "../../middleware/cartCount.js";
import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import Variant from "../../models/Variant.js";
import Wishlist from "../../models/Wishlist.js";

export const loadCart = async (req, res) => {
  try {
    const userId = req.session.user.id;

    let cart = await Cart.findOne({ user: userId }).populate({
      path: "items.variant",
      populate: {
        path: "product",
        populate: [
          {
            path: "brand",
          },
          {
            path: "category",
          },
        ],
      },
    });

    if (!cart) {
      cart = {
        items: [],
        giftWrap: false,
      };
    }

    let subtotal = 0;
    let shipping = 0;
    let giftWrapAmount = cart.giftWrap ? 30 : 0;
    let discount = 0;
    let hasUnavailableProducts = false;

    cart.items.forEach((item) => {
      const variant = item.variant;

      if (
        !variant ||
        variant.isDeleted ||
        !variant.product ||
        variant.product.isDeleted ||
        !variant.product.isListed ||
        variant.stock <= 0
      ) {
        hasUnavailableProducts = true;

        return;
      }

      const price = variant.salePrice > 0 ? variant.salePrice : variant.price;

      subtotal += price * item.quantity;
    });

    if (subtotal >= 999) {
      shipping = 0;
    } else {
      shipping = 100;
    }

    const grandTotal = subtotal + shipping + giftWrapAmount - discount;

    const message = req.session.message;

    delete req.session.message;

    res.render("user/cart/cart", {
      cart,
      subtotal,
      shipping,
      giftWrapAmount,
      discount,
      grandTotal,
      hasUnavailableProducts,
      message,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/");
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const { variantId, quantity } = req.body;

    const variant = await Variant.findById(variantId).populate("product");

    if (
      !variant ||
      variant.isDeleted ||
      variant.product.isDeleted ||
      !variant.product.isListed
    ) {
      return res.json({
        success: false,
        message: "Product unavailable.",
      });
    }

    if (variant.stock <= 0) {
      return res.json({
        success: false,
        message: "Out of stock.",
      });
    }

    let cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
      });
    }

    const existing = cart.items.find(
      (item) => item.variant.toString() === variantId,
    );

    if (existing) {
      const newQty = existing.quantity + Number(quantity);

      if (newQty > 10) {
        return res.json({
          success: false,
          message: "Maximum quantity reached.",
        });
      }

      if (newQty > variant.stock) {
        return res.json({
          success: false,
          message: "Stock limit exceeded.",
        });
      }

      existing.quantity = newQty;
    } else {
      cart.items.push({
        variant: variantId,

        quantity,
      });
    }

    await cart.save();

    delete req.session.coupon;

    await Wishlist.deleteOne({
      user: userId,

      product: variant.product._id,
    });

    const totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,

      message: "Added to cart.",

      cartCount: totalCount,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,

      message: "Something went wrong.",
    });
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const { itemId, action } = req.body;

    const cart = await Cart.findOne({
      user: userId,
    }).populate({
      path: "items.variant",
      populate: {
        path: "product",
      },
    });

    if (!cart) {
      return res.json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.json({
        success: false,
        message: "Cart item not found",
      });
    }

    const variant = item.variant;

    if (
      !variant ||
      variant.isDeleted ||
      !variant.product ||
      variant.product.isDeleted ||
      !variant.product.isListed
    ) {
      return res.json({
        success: false,
        message: "This product is currently unavailable.",
      });
    }

    if (action === "increase") {
      if (variant.stock <= 0) {
        return res.json({
          success: false,
          message: "This product is out of stock.",
        });
      }

      if (item.quantity >= variant.stock) {
        return res.json({
          success: false,
          message: `Only ${variant.stock} item(s) available in stock.`,
        });
      }

      if (item.quantity >= 10) {
        return res.json({
          success: false,
          message: "Maximum quantity allowed is 10.",
        });
      }

      item.quantity++;
    } else if (action === "decrease") {
      if (item.quantity > 1) {
        item.quantity--;
      }
    } else {
      return res.json({
        success: false,
        message: "Invalid quantity action.",
      });
    }

    await cart.save();

    delete req.session.coupon;

    let subtotal = 0;

    cart.items.forEach((cartItem) => {
      const cartVariant = cartItem.variant;

      if (
        !cartVariant ||
        cartVariant.isDeleted ||
        !cartVariant.product ||
        cartVariant.product.isDeleted ||
        !cartVariant.product.isListed
      ) {
        return;
      }

      const price =
        Number(cartVariant.salePrice) > 0
          ? Number(cartVariant.salePrice)
          : Number(cartVariant.price);

      subtotal += price * Number(cartItem.quantity);
    });

    subtotal = Math.round((subtotal + Number.EPSILON) * 100) / 100;

    const shipping = subtotal >= 999 ? 0 : 100;

    const giftWrapAmount = cart.giftWrap ? 30 : 0;

    const discount = 0;

    const grandTotal =
      Math.round(
        (subtotal + shipping + giftWrapAmount - discount + Number.EPSILON) *
          100,
      ) / 100;

    const totalCount = cart.items.reduce(
      (sum, cartItem) => sum + Number(cartItem.quantity),
      0,
    );

    const itemPrice =
      Number(variant.salePrice) > 0
        ? Number(variant.salePrice)
        : Number(variant.price);

    const itemTotal =
      Math.round((itemPrice * Number(item.quantity) + Number.EPSILON) * 100) /
      100;

    return res.json({
      success: true,

      quantity: item.quantity,

      itemTotal,

      itemPrice,

      subtotal,

      shipping,

      giftWrapAmount,

      discount,

      grandTotal,

      cartCount: totalCount,
    });
  } catch (error) {
    console.log("updateCartQuantity ERROR:", error);

    return res.json({
      success: false,

      message: "Something went wrong.",
    });
  }
};
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      return res.json({
        success: false,
        message: "Cart not found.",
      });
    }

    cart.items.pull(req.params.itemId);

    await cart.save();

    delete req.session.coupon;

    let subtotal = 0;

    const populatedCart = await Cart.findOne({
      user: userId,
    }).populate({
      path: "items.variant",
      populate: {
        path: "product",
      },
    });

    if (populatedCart) {
      populatedCart.items.forEach((item) => {
        const variant = item.variant;

        if (
          !variant ||
          variant.isDeleted ||
          !variant.product ||
          variant.product.isDeleted ||
          !variant.product.isListed ||
          variant.stock <= 0
        ) {
          return;
        }

        const price =
          variant.salePrice > 0
            ? Number(variant.salePrice)
            : Number(variant.price);

        subtotal += price * Number(item.quantity);
      });
    }

    subtotal = Math.round((subtotal + Number.EPSILON) * 100) / 100;

    let shipping = 0;

    if (subtotal > 0 && subtotal < 999) {
      shipping = 100;
    }

    const giftWrapAmount = populatedCart?.giftWrap ? 30 : 0;

    const grandTotal =
      Math.round((subtotal + shipping + giftWrapAmount) * 100) / 100;

    const totalCount =
      populatedCart?.items.reduce(
        (sum, item) => sum + Number(item.quantity),
        0,
      ) || 0;

    return res.json({
      success: true,

      message: "Item removed.",

      cartCount: totalCount,

      subtotal,

      shipping,

      giftWrapAmount,

      grandTotal,

      isEmpty: totalCount === 0,
    });
  } catch (error) {
    console.log("removeCartItem ERROR:", error);

    return res.json({
      success: false,

      message: "Unable to remove item.",
    });
  }
};
export const toggleGiftWrap = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      return res.json({
        success: false,
      });
    }

    cart.giftWrap = !cart.giftWrap;

    await cart.save();

    res.json({
      success: true,

      giftWrap: cart.giftWrap,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
    });
  }
};
