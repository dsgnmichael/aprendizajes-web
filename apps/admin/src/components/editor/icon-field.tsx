'use client'

import { useId } from 'react'
import { Controller, useFormContext, type FieldValues } from 'react-hook-form'
import {
  Activity,
  Award,
  Baby,
  BookOpen,
  Brain,
  Calendar,
  Clock,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  House,
  Languages,
  type LucideIcon,
  MapPin,
  MessageCircle,
  Monitor,
  Pencil,
  Puzzle,
  School,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Stethoscope,
  User,
  Users,
  Video,
} from 'lucide-react'
import { ICON_LABELS, ICON_NAMES, type IconName } from '@repo/domain'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

/** Same whitelist the public site renders (CMS can't request arbitrary icons). */
export const ICON_COMPONENTS: Record<IconName, LucideIcon> = {
  user: User,
  users: Users,
  baby: Baby,
  'graduation-cap': GraduationCap,
  brain: Brain,
  puzzle: Puzzle,
  'book-open': BookOpen,
  'heart-handshake': HeartHandshake,
  monitor: Monitor,
  video: Video,
  'map-pin': MapPin,
  home: House,
  calendar: Calendar,
  clock: Clock,
  'message-circle': MessageCircle,
  sparkles: Sparkles,
  school: School,
  smile: Smile,
  'hand-heart': HandHeart,
  stethoscope: Stethoscope,
  pencil: Pencil,
  languages: Languages,
  activity: Activity,
  'shield-check': ShieldCheck,
  star: Star,
  award: Award,
}

function IconOption({ name }: { name: IconName }) {
  const Icon = ICON_COMPONENTS[name] ?? Sparkles
  return (
    <span className="flex items-center gap-2">
      <Icon className="size-4" aria-hidden />
      {ICON_LABELS[name]}
    </span>
  )
}

/** Icon picker with visual preview, restricted to the whitelisted icon names. */
export function IconField({ name, label }: { name: string; label: string }) {
  const id = useId()
  const { control } = useFormContext<FieldValues>()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const value = (ICON_NAMES as readonly string[]).includes(String(field.value))
          ? (field.value as IconName)
          : 'sparkles'
        return (
          <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Select value={value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={label}>
                <SelectValue>
                  <IconOption name={value} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {ICON_NAMES.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    <IconOption name={icon} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }}
    />
  )
}
