"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { MailCheck } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { registerSchema, type RegisterInput } from "@/lib/validation/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", phone: "", email: "", password: "", confirmPassword: "" },
  })

  async function onSubmit(values: RegisterInput) {
    setSubmitting(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { name: values.name, phone: values.phone || null },
      },
    })
    setSubmitting(false)

    if (error) {
      toast.error("Registrasi gagal", { description: error.message })
      return
    }

    if (!data.session) {
      // Email confirmation is required before the account has a session --
      // the profile row is still created (via a DB trigger on auth.users)
      // so activation works the same either way once they confirm & log in.
      setNeedsEmailConfirm(true)
      return
    }

    toast.success("Registrasi berhasil")
    router.replace("/pending-approval")
    router.refresh()
  }

  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden p-4">
      <video
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="/videos/login-background.webm" type="video/webm" />
        <source src="/videos/login-background.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/40 to-black/70" />

      <Card className="w-full max-w-sm border-white/15 bg-white/90 backdrop-blur-md dark:bg-black/60">
        {needsEmailConfirm ? (
          <>
            <CardHeader>
              <div className="mb-1 flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <MailCheck className="size-5" />
                </span>
                <CardTitle className="text-xl leading-tight">Cek Email Anda</CardTitle>
              </div>
              <CardDescription>
                Kami sudah kirim link konfirmasi ke email Anda. Setelah dikonfirmasi, login lalu
                tunggu akun Anda diaktifkan oleh Owner/Admin farm.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login">Kembali ke Login</Link>
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <div className="mb-1 flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                  <Image
                    src="/images/logo-master.png"
                    alt="Bangun Layer Farm"
                    width={48}
                    height={48}
                    className="size-full object-cover"
                    priority
                  />
                </span>
                <CardTitle className="text-xl leading-tight">Daftar Akun Pekerja</CardTitle>
              </div>
              <CardDescription>
                Akun baru dibuat dengan peran pekerja dan menunggu aktivasi Owner/Admin sebelum
                bisa mengisi laporan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input autoComplete="name" placeholder="Nama Anda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. HP (opsional)</FormLabel>
                        <FormControl>
                          <Input autoComplete="tel" placeholder="08xxxxxxxxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="username" placeholder="nama@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ulangi Password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Memproses..." : "Daftar"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Sudah punya akun?{" "}
                    <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                      Masuk
                    </Link>
                  </p>
                </form>
              </Form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
