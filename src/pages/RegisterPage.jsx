import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient"; 
import defaultProfile from "../assets/default-profile.png"; 

export default function RegisterPage() {
    const [form, setForm] = useState({
        email: "",
        password: "",
        username: "",
        bio: "",
        profile_image: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async () => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // 1. Register user with Supabase Auth
        const { user, error: signUpError } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        let profileImageUrl = null;

        // 2. Upload profile image if provided
        if (form.profile_image) {
            const file = form.profile_image;
            const fileExt = file.name.split('.').pop();
            const filePath = `profile_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from("profile-images")
                .upload(filePath, file);

            if (uploadError) {
                setError("Image upload failed.");
                setLoading(false);
                return;
            }
            const { data } = supabase.storage
                .from("profile-images")
                .getPublicUrl(filePath);
            profileImageUrl = data.publicUrl;
        }

        // 3. Insert user profile into DB
        const { error: profileError } = await supabase.from("profiles").insert([
            {
                id: user.id,
                username: form.username,
                bio: form.bio,
                profile_image: profileImageUrl,
            },
        ]);

        if (profileError) {
            setError(profileError.message);
            setLoading(false);
            return;
        }

        // Registration successful, navigate to login or home
        setLoading(false);
        navigate("/login");
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "profile_image") {
            setForm((prev) => ({
                ...prev,
                profile_image: files[0],
            }));
        } else {
            setForm((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form
                className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
                onSubmit={handleSubmit}
            >
                <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
                {error && <div className="text-red-500">{error}</div>}
                <input
                    className="w-full border rounded px-3 py-2"
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                    value={form.email}
                    onChange={handleChange}
                />
                <input
                    className="w-full border rounded px-3 py-2"
                    type="password"
                    name="password"
                    placeholder="Password"
                    required
                    value={form.password}
                    onChange={handleChange}
                />
                <input
                    className="w-full border rounded px-3 py-2"
                    type="text"
                    name="username"
                    placeholder="Username"
                    required
                    value={form.username}
                    onChange={handleChange}
                />
                <textarea
                    className="w-full border rounded px-3 py-2"
                    name="bio"
                    placeholder="Bio (optional)"
                    value={form.bio}
                    onChange={handleChange}
                />
                <div>
                    <label className="block mb-1">Profile Image (optional)</label>
                    <input
                        type="file"
                        name="profile_image"
                        accept="image/*"
                        onChange={handleChange}
                    />
                </div>
                <button
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Registering..." : "Register"}
                </button>
                <div className="text-center mt-2">
                    Already have an account?{" "}
                    <a href="/login" className="text-blue-600 hover:underline">
                        Login
                    </a>
                </div>
            </form>
        </div>
    );
}