import bcrypt from 'bcryptjs';

import Admin from '../../models/Admin.js';

export const loadAdminLogin = (req, res) => {

    res.render('admin/auth/login');
};

export const adminLogin = async (req, res) => {

    try {

        const { email, password } = req.body;
        if (!email || !password) {

            return res.json({

                success: false,

                message: 'All fields are required'
            });
        }else if(!email.includes("@")){
            return res.json({
                success:false,
                message:'Given email is not valid'
            })
        }
        const admin = await Admin.findOne({ email });

        if (!admin) {

            return res.json({

                success: false,

                message: 'Admin not found'
            });
        }

        const isMatch =
        await bcrypt.compare(
            password,
            admin.password
        );

        if (!isMatch) {

            return res.json({

                success: false,

                message: 'Invalid password'
            });
        }

        req.session.admin = {

            id: admin._id,

            email: admin.email
        };

        return res.json({

            success: true,

            next: '/admin/dashboard'
        });

    } catch (error) {

        console.log(error);

        return res.json({

            success: false,

            message: 'Something went wrong'
        });
    }
};

export const adminDashboard = (req, res) => {

    res.render("admin/dashboard/dashboard", {
    active: "dashboard"
  });
};

export const adminLogout = (req, res) => {

    req.session.destroy(() => {

        res.redirect('/admin/login');
    });
};