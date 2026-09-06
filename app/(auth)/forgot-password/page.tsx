"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import Image from "next/image"
import { MailCheck } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth"
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

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: ForgotPasswordInput) {
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    })
    setSubmitting(false)

    if (error) {
      toast.error("Gagal mengirim link reset", { description: error.message })
      return
    }
    setSent(true)
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden p-4">
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

      <span className="mb-4 flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
        <Image src="/images/logo-master.png" alt="Bangun Layer Farm" width={80} height={80} className="size-full object-cover" priority />
      </span>

      <Card className="w-full max-w-sm border-white/15 bg-white/90 backdrop-blur-md dark:bg-black/60">
        {sent ? (
          <>
            <CardHeader>
              <div className="mb-1 flex justify-center">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <MailCheck className="size-5" />
                </span>
              </div>
              <CardTitle className="text-center text-xl leading-tight">Cek Email Anda</CardTitle>
              <CardDescription className="text-center">
                Kami sudah kirim link reset password ke email Anda (jika terdaftar). Buka email
                tersebut untuk membuat password baru.
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
              <CardTitle className="text-center text-xl leading-tight">Lupa Password</CardTitle>
              <CardDescription className="text-center">
                Masukkan email Anda, kami akan kirim link untuk membuat password baru.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="username"
                            placeholder="nama@layerfarm-pilot.id"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Mengirim..." : "Kirim Link Reset"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Ingat password Anda?{" "}
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
