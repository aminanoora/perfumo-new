import User from "../../models/User.js";
import Address from "../../models/Address.js";
import bcrypt from "bcrypt";
import Order from "../../models/Order.js";

export const getUsersPage = async (req, res) => {

  try {

    const search =
      req.query.search || '';

    const status =
      req.query.status || 'all';

    const sort =
      req.query.sort || 'desc';

    const page =
      Number(req.query.page) || 1;

    const limit = 10;

    const skip =
      (page - 1) * limit;

    let query = {};

    if (search) {

      query.$or = [

        {
          firstName: {
            $regex: search,
            $options: 'i'
          }
        },

        {
          lastName: {
            $regex: search,
            $options: 'i'
          }
        },

        {
          email: {
            $regex: search,
            $options: 'i'
          }
        }

      ];
    }

    if (status === 'active') {

      query.isBlocked = false;
    }

    if (status === 'blocked') {

      query.isBlocked = true;
    }

    const totalUsers =
      await User.countDocuments(query);

    const users =
      await User.find(query)
      .sort({
        createdAt:
          sort === 'asc'
            ? 1
            : -1
      })
      .skip(skip)
      .limit(limit);

    const totalPages =
      Math.ceil(totalUsers / limit);

      for (const user of users) {
    user.ordersCount = await Order.countDocuments({
        user: user._id
    });
}

    res.render(
      'admin/users/users',
      {
        users,
        active: 'users',
        search,
        status,
        sort,
        page,
        totalPages
      }
    );

  } catch (error) {

    console.log(error);

    res.status(500).send('Server Error');
  }
};
export const getUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.render("admin/users/users", { users, active: "users" });
};

export const getUserDetails = async (req, res) => {

  const user = await User.findById(req.params.id);

  const address = await Address.find({
    userId: user._id
  });

  console.log(address);

  res.render("admin/users/user-details", {
    user,
    address,
    active: "users"
  });

};



export const updateUser = async (req, res) => {
  try {

    const updateData = {};

    if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;

    if (req.body.isBlocked !== undefined) {
      updateData.isBlocked = req.body.isBlocked === true || req.body.isBlocked === "true";
    }

    await User.findByIdAndUpdate(req.params.id, updateData);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
export const deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  await Address.deleteMany({ userId: req.params.id });
  res.json({ success: true });
};
export const addUser = async (req, res) => {

  try {

    console.log(req.body);

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      addressFirstName,
      addressLastName,
      phoneNumber,
      pincode,
      streetAddress,
      city,
      state,
      country
    } = req.body;

   
    const existingUser = await User.findOne({
      email
    });

    if (existingUser) {

      return res.json({
        success: false,
        message: "Email already exists"
      });

    }
    if(phone.length!==10||!phone){
      return res.json({
        success:false,
        message:'Phone number should be 10 digits'
      })
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

  
    const newUser = await User.create({

      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword

    });

    console.log("USER CREATED:", newUser._id);

   
    await Address.create({

      userId: newUser._id,

      firstName: addressFirstName,
      lastName: addressLastName,
      phoneNumber,
      pincode,
      streetAddress,
      city,
      state,
      country

    });

    console.log("ADDRESS SAVED");

    return res.json({
      success: true
    });

  } catch (err) {

    console.log(err);

    return res.json({
      success: false,
      message: "Server error"
    });

  }

};

export const searchUsers = async (req, res) => {

    try {

        const search = req.query.search || '';

        const users = await User.find({

            $or: [

                {
                    firstName: {
                        $regex: search,
                        $options: 'i'
                    }
                },

                {
                    email: {
                        $regex: search,
                        $options: 'i'
                    }
                }
            ]
        });

        res.render(
            'admin/users/users',
            { users }
        );

    } catch (error) {

        console.log(error);

        res.redirect('/admin/dashboard');
    }
};

// export const getUsers = async (req, res) => {

//     try {

//         const status =
//             req.query.status;

//         let query = {};

//         if (status === 'active') {

//             query.isBlocked = false;
//         }

//         if (status === 'blocked') {

//             query.isBlocked = true;
//         }

//         const users =
//             await User.find(query);

//         res.render(
//             'admin/users',
//             { users }
//         );

//     } catch (error) {

//         console.log(error);
//     }
// };

