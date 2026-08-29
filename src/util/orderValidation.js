import Variant from "../models/Variant.js";

export const validateCartItems = async (cartItems) => {
  for (const item of cartItems) {
    const variant = await Variant.findById(item.variant._id).populate(
      "product",
    );

    if (!variant) {
      return {
        valid: false,
        message: "Product variant not found.",
      };
    }

    if (variant.isDeleted) {
      return {
        valid: false,
        message: `${variant.product.name} is unavailable.`,
      };
    }

    if (!variant.product) {
      return {
        valid: false,
        message: "Product not found.",
      };
    }

    if (variant.product.isDeleted) {
      return {
        valid: false,
        message: `${variant.product.name} has been removed.`,
      };
    }

    if (!variant.product.isListed) {
      return {
        valid: false,
        message: `${variant.product.name} is currently unavailable.`,
      };
    }

    if (variant.stock <= 0) {
      return {
        valid: false,
        message: `${variant.product.name} is out of stock.`,
      };
    }

    if (item.quantity > variant.stock) {
      return {
        valid: false,
        message: `Only ${variant.stock} ${variant.product.name} available.`,
      };
    }
  }

  return {
    valid: true,
  };
};
