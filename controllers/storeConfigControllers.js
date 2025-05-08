const { Store, validateStore } = require("../models/StoreConfig");

const createStore = async (req, res) => {
  const { error } = validateStore(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      errors: error.details.map((e) => e.message),
    });
  }

  try {
    const newStore = new Store({
      storeName: req.body.storeName,
      storeURL: req.body.storeURL,
      currency: req.body.currency,
      defaultLanguage: req.body.defaultLanguage,
      shippingMethods: req.body.shippingMethods || [],
    });

    await newStore.save();

    res.status(201).json({
      success: true,
      message: "Store created successfully",
      data: newStore,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while creating the store",
      error: err.message,
    });
  }
};

const editStore = async (req, res) => {
  const { error } = validateStore(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      errors: error.details.map((e) => e.message),
    });
  }

  try {
    const storeId = req.params.id;
    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    store.storeName = req.body.storeName || store.storeName;
    store.storeURL = req.body.storeURL || store.storeURL;
    store.currency = req.body.currency || store.currency;
    store.defaultLanguage = req.body.defaultLanguage || store.defaultLanguage;
    store.shippingMethods = req.body.shippingMethods || store.shippingMethods;

    await store.save();

    res.status(200).json({
      success: true,
      message: "Store updated successfully",
      data: store,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while updating the store",
      error: err.message,
    });
  }
};

const addShippingMethod = async (req, res) => {
  const { storeId } = req.params;
  const {
    methodName,
    cost,
    estimatedDeliveryMin,
    estimatedDeliveryMax,
    active,
  } = req.body;

  if (!methodName || !cost || !estimatedDeliveryMin || !estimatedDeliveryMax) {
    return res.status(400).json({
      success: false,
      message:
        "All fields are required: methodName, cost, estimatedDeliveryMin, estimatedDeliveryMax",
    });
  }

  try {
    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    const newShippingMethod = {
      methodName,
      cost,
      estimatedDeliveryMin,
      estimatedDeliveryMax,
      active: active !== undefined ? active : true,
    };

    store.shippingMethods.push(newShippingMethod);

    await store.save();

    res.status(200).json({
      success: true,
      message: "Shipping method added successfully",
      data: store,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while adding the shipping method",
      error: err.message,
    });
  }
};

const getStore = async (req, res) => {
    const storeId = req.params.storeId;
  
    try {
      const store = await Store.findById(storeId);
  
      if (!store) {
        return res.status(404).json({
          success: false,
          message: "Store not found",
        });
      }
  

      const activeShippingMethods = store.shippingMethods.filter(
        (method) => !method.deleted
      );
  
      res.status(200).json({
        success: true,
        message: "Store retrieved successfully",
        data: { ...store.toObject(), shippingMethods: activeShippingMethods },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong while retrieving the store",
        error: err.message,
      });
    }
  };
  

const editShippingMethod = async (req, res) => {
  const { storeId, methodId } = req.params; 
  console.log("Method ID:", methodId);
  console.log("Shipping Methods:", methodId);

  const {
    methodName,
    cost,
    estimatedDeliveryMin,
    estimatedDeliveryMax,
    active,
  } = req.body;

  if (!methodName || !cost || !estimatedDeliveryMin || !estimatedDeliveryMax) {
    return res.status(400).json({
      success: false,
      message:
        "All fields are required: methodName, cost, estimatedDeliveryMin, estimatedDeliveryMax",
    });
  }

  try {
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    const shippingMethodIndex = store.shippingMethods.findIndex(
      (method) => method._id.toString() === methodId
    );
    if (shippingMethodIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Shipping method not found",
      });
    }

    store.shippingMethods[shippingMethodIndex] = {
      ...store.shippingMethods[shippingMethodIndex], 
      methodName,
      cost,
      estimatedDeliveryMin,
      estimatedDeliveryMax,
      active:
        active !== undefined
          ? active
          : store.shippingMethods[shippingMethodIndex].active, 
    };

    await store.save();

    res.status(200).json({
      success: true,
      message: "Shipping method updated successfully",
      data: store,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while updating the shipping method",
      error: err.message,
    });
  }
};


const deleteShippingMethod = async (req, res) => {
    const { storeId, methodId } = req.params;
  
    try {
      const store = await Store.findById(storeId);
      if (!store) {
        return res.status(404).json({
          success: false,
          message: "Store not found",
        });
      }
  
      
      const shippingMethodIndex = store.shippingMethods.findIndex(
        (method) => method._id.toString() === methodId
      );
      if (shippingMethodIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Shipping method not found",
        });
      }
  
     
      store.shippingMethods[shippingMethodIndex].deleted = true;
  
      await store.save();
  
      res.status(200).json({
        success: true,
        message: "Shipping method soft deleted successfully",
        data: store,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong while deleting the shipping method",
        error: err.message,
      });
    }
  };
  
module.exports = {
  createStore,
  editStore,
  addShippingMethod,
  getStore,
  editShippingMethod,
  deleteShippingMethod,
};
