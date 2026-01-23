import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { User, LogOut, Camera, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (user) {
        setAvatarUrl(user.user_metadata?.avatar_url || "");
        setFullName(user.user_metadata?.full_name || "");
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
        const { error } = await supabase.auth.updateUser({
            data: {
                full_name: fullName,
                avatar_url: avatarUrl
            }
        });
        
        if (error) throw error;
        
        toast.success("Profile updated successfully!");
        setIsEditing(false);
    } catch (error: any) {
        toast.error("Error updating profile: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  if (!user) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-slate-400">Please sign in to view your profile.</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-cyan-500/20 to-purple-500/20" />
          
          <div className="relative flex flex-col md:flex-row gap-8 items-start">
            <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-black/50 overflow-hidden bg-slate-800 flex items-center justify-center">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = "")} />
                    ) : (
                        <User className="w-12 h-12 text-slate-400" />
                    )}
                </div>
                {isEditing && (
                    <div className="absolute bottom-0 right-0 p-2 bg-cyan-500 rounded-full text-white cursor-pointer shadow-lg hover:bg-cyan-600 transition-colors">
                        <Camera size={16} />
                    </div>
                )}
            </div>

            <div className="flex-1 w-full space-y-6 pt-4">
                <div className="flex justify-between items-start">
                    <div>
                        {isEditing ? (
                            <div className="space-y-4 max-w-sm">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Display Name</Label>
                                    <Input 
                                        id="fullName" 
                                        value={fullName} 
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="bg-black/20 border-white/10 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                                    <Input 
                                        id="avatarUrl" 
                                        value={avatarUrl} 
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                        placeholder="https://example.com/me.jpg"
                                        className="bg-black/20 border-white/10 text-white"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold text-slate-100">{fullName || "User"}</h1>
                                <p className="text-slate-400 mt-1">{user.email}</p>
                            </>
                        )}
                    </div>
                    
                    {!isEditing && (
                        <Button variant="outline" onClick={() => setIsEditing(true)} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                            Edit Profile
                        </Button>
                    )}
                </div>

                {isEditing && (
                    <div className="flex gap-3">
                        <Button 
                            onClick={handleUpdateProfile} 
                            disabled={loading}
                            className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                        >
                            <Save size={16} className="mr-2" /> Save Changes
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsEditing(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            <X size={16} className="mr-2" /> Cancel
                        </Button>
                    </div>
                )}
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10">
            <h2 className="text-xl font-semibold mb-4 text-cyan-400">Account Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                    <span className="block text-slate-500 text-sm mb-1">User ID</span>
                    <span className="font-mono text-sm">{user.id}</span>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                    <span className="block text-slate-500 text-sm mb-1">Last Sign In</span>
                    <span>{new Date(user.last_sign_in_at || "").toLocaleString()}</span>
                </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 flex justify-end">
            <Button 
                variant="destructive" 
                onClick={signOut}
                className="flex items-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50"
            >
                <LogOut size={18} />
                Sign Out
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
