import { supabase } from "./supabase";
import { activityLogRepository } from "./activityLogRepository";
import { TestimonialItem } from "@/src/constants/testimonials";

export const testimonialRepository = {
  /**
   * Mengambil semua testimoni dari Supabase, diurutkan dari yang terbaru.
   */
  async getTestimonials(): Promise<TestimonialItem[]> {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("Error fetching testimonials:", error);
      throw new Error("Gagal mengambil data testimoni");
    }

    return data || [];
  },

  /**
   * Menyimpan testimoni baru ke Supabase.
   */
  async saveTestimonial(testimonial: Omit<TestimonialItem, "id"> & { id?: string }): Promise<TestimonialItem> {
    const isNew = !testimonial.id || testimonial.id.startsWith("testi-");
    
    // Jangan kirim ID string lokal "testi-..." ke Supabase karena Supabase menggunakan UUID.
    const { id, ...dataToSave } = testimonial;

    if (isNew) {
      const { data, error } = await supabase
        .from("testimonials")
        .insert([dataToSave])
        .select()
        .single();

      if (error) {
        console.error("Error inserting testimonial:", error);
        throw new Error("Gagal menyimpan testimoni baru");
      }

      await activityLogRepository.logActivity({
        action: "Tambah Testimoni",
        entity_type: "testimonial",
        entity_id: data.id,
        description: `Menambahkan testimoni baru dari ${dataToSave.name}`,
        metadata: { name: dataToSave.name },
      });

      return data;
    } else {
      const { data, error } = await supabase
        .from("testimonials")
        .update(dataToSave)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating testimonial:", error);
        throw new Error("Gagal memperbarui testimoni");
      }

      await activityLogRepository.logActivity({
        action: "Edit Testimoni",
        entity_type: "testimonial",
        entity_id: data.id,
        description: `Memperbarui testimoni dari ${dataToSave.name}`,
        metadata: { name: dataToSave.name },
      });

      return data;
    }
  },

  /**
   * Menghapus testimoni dari Supabase berdasarkan UUID.
   */
  async deleteTestimonial(id: string): Promise<void> {
    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting testimonial:", error);
      throw new Error("Gagal menghapus testimoni");
    }

    await activityLogRepository.logActivity({
      action: "Hapus Testimoni",
      entity_type: "testimonial",
      entity_id: id,
      description: `Menghapus testimoni`,
      metadata: { testimonial_id: id },
    });
  }
};
