import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userID: { type: String, required: true, unique: true },
    products: [
      {
        productID: { type: mongoose.Types.ObjectId },
        size: { type: String },
        color: { type: String },
        quantity: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
