/**
 * Seed script to insert 3 new certificate records into Supabase.
 * 
 * HOW TO USE:
 * 1. Make sure your dev server is running (npm run dev)
 * 2. Open browser console (F12)
 * 3. Import and run:
 *    import { seedCertificates } from './utils/seedCertificates'
 *    await seedCertificates()
 * 
 * OR visit /seed route after adding the route to your router.
 */

import { supabase } from "../supabase";

const newCertificates = [
  { Img: "/MMS Certificate.jpg" },
  { Img: "/Makrab Certificate.jpg" },
  { Img: "/Introduction Certificate.jpg" },
];

export async function seedCertificates() {
  console.log("🌱 Seeding 3 certificates into Supabase...");

  for (const cert of newCertificates) {
    const { data, error } = await supabase
      .from("certificates")
      .insert([cert])
      .select();

    if (error) {
      console.error(`❌ Error inserting ${cert.Img}:`, error.message);
    } else {
      console.log(`✅ Successfully inserted: ${cert.Img}`, data);
    }
  }

  console.log("🎉 Seed complete!");
  return { success: true };
}

