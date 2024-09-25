import mongoose from "mongoose";
import Product from "../models/product.model.js";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "../utils/cloudinaryMethods.js";

export const addProduct = async (req, res) => {
  const id = new mongoose.Types.ObjectId();
  try {
    const image = await uploadImageToCloudinary(req.body.img, id);
    req.body.img = image.url;
    const savedProduct = await Product.create({ ...req.body, _id: id });
    res.status(200).json(savedProduct);
  } catch (err) {
    if (err.name === "ValidationError") {
      if (err.name == "ValidationError") {
        for (field in err.errors) {
          return res
            .status(400)
            .json({ success: false, message: err.errors[field].message });
        }
      }
    }
    if (err.code === 11000) {
      const duplicate = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        message: `A product already exist with the same ${duplicate}`,
      });
    }
    return res.status(500).json({ message: "internal server Error" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    if (req.body.img.split("/")[0] === "data:image") {
      const image = await uploadImageToCloudinary(req.body.img, req.body._id);
      console.log(image);
      req.body.img = image.url;
    }
    const updateProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updateProduct);
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
};

export const deleteProduct = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id))
    return res
      .status(403)
      .json({ message: "The product you provided is not a valid id" });
  try {
    await Product.findByIdAndDelete(id);
    const result = await deleteImageFromCloudinary(id);
    res.status(200).json({ message: "product deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: "failed to delete product" });
  }
};

export const getProductInfo = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json("Invalid Product ID");
  }

  try {
    const savedProducts = await Product.findById(req.params.id);
    if (!savedProducts) {
      return res.status(404).json({ message: "Product not Found" });
    }
    res.status(200).json(savedProducts);
  } catch (err) {
    res.status(500).json({ message: "internal server Error" });
  }
};

export const getAllProducts = async (req, res) => {
  // Parse and default offset and limit
  const offset = parseInt(req.query.offset, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;
  const skip = (offset - 1) * limit;

  // Extract query parameters
  const qCategory = req.query.category;
  const qSort = req.query.sort;
  const qColor = req.query.color;
  const qSize = req.query.size;
  const qs = req.query.search;

  try {
    // Base query
    let query = Product.find();

    // Filter array
    const filterArr = [];

    // Check if search string is provided
    if (qs) {
      // Ensure search is applied correctly
      filterArr.push({
        $or: [
          { title: { $regex: qs, $options: "i" } },
          { productNo: { $regex: qs, $options: "i" } },
          { desc: { $regex: qs, $options: "i" } },
          { categories: { $in: [qs] } },
        ],
      });
    }

    // Apply other filters if provided
    if (qCategory) filterArr.push({ categories: { $in: [qCategory] } });
    if (qColor) filterArr.push({ color: { $in: [qColor] } });
    if (qSize) filterArr.push({ size: { $in: [qSize] } });

    if (filterArr.length > 0) {
      query = query.find({ $and: filterArr });
    }

    // Sorting logic
    switch (qSort) {
      case "newest":
        query.sort({ createdAt: -1 });
        break;
      case "price-asc":
        query.sort({ price: 1 });
        break;
      case "price-desc":
        query.sort({ price: -1 });
        break;
      case "top-purchased":
        query.sort({ purchasedCount: -1 });
        break;
      case "top-rated":
        query.sort({ ratingsAverage: -1, ratingsQuantity: -1 });
        break;
      case "top-reviewed":
        query.sort({ ratingsQuantity: -1 });
        break;
      default:
        // No sorting if the query doesn't match known values
        break;
    }

    // Apply pagination
    query.skip(skip).limit(limit);

    // Fetch filtered products
    const products = await query.exec();

    // Count documents with filters
    const totalCount = await Product.countDocuments(
      filterArr.length > 0 ? { $and: filterArr } : {}
    );

    res.status(200).json({ data: products, totalCount });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to get products" });
  }
};

export const searchProducts = async (req, res) => {
  const s = req.params.s;
  if (!s) {
    return res.status(400).json("not found");
  }
  try {
    const products = await Product.find(
      {
        $or: [
          { title: { $regex: s, $options: "i" } },
          { productNo: { $regex: s, $options: "i" } },
          { desc: { $regex: s, $options: "i" } },
          { categories: { $in: [s] } },
        ],
      },
      {
        title: 1,
        _id: 1,
      }
    ).limit(5);

    return res.status(200).json(products);
  } catch (error) {
    console.log(error);
    return res.status(500).json("internal server error");
  }
};
