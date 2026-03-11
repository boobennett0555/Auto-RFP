import { createClient } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const sectionId = formData.get('sectionId')

    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const ext = file.name.split('.').pop()
    const filename = `${sectionId}/${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()

    const { data, error } = await supabase.storage
      .from('rfp-images')
      .upload(filename, bytes, { contentType: file.type, upsert: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from('rfp-images').getPublicUrl(data.path)
    return Response.json({ url: publicUrl, path: data.path, name: file.name })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
