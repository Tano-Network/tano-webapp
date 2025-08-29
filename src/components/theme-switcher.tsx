'use client'

import * as React from 'react'
import { Moon, Sun, Laptop, Paintbrush, Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'

const colors = [
  { name: 'purple', color: 'hsl(260 80% 60%)' },
  { name: 'blue', color: 'hsl(210 80% 60%)' },
  { name: 'green', color: 'hsl(145 63% 49%)' },
  { name: 'red', color: 'hsl(0 72% 51%)' },
  { name: 'orange', color: 'hsl(25 95% 53%)' },
  { name: 'yellow', color: 'hsl(48 96% 50%)' },
  { name: 'pink', color: 'hsl(340 82% 52%)' },
  { name: 'indigo', color: 'hsl(263 70% 50%)' },
]

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mode, setMode] = React.useState('system')
  const [color, setColor] = React.useState('purple')

  React.useEffect(() => {
    const currentTheme = theme || 'system'
    const themeParts = currentTheme.split('-')
    if (themeParts.length === 2) {
      setMode(themeParts[0])
      setColor(themeParts[1])
    } else {
      setMode(currentTheme)
      setColor('purple')
    }
  }, [theme])

  const handleModeChange = (newMode: string) => {
    setMode(newMode)
    if (newMode === 'system') {
      setTheme('system')
    } else {
      if (color === 'purple') {
        setTheme(newMode)
      } else {
        setTheme(`${newMode}-${color}`)
      }
    }
  }

  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    let currentMode = mode
    if (mode === 'system') {
      currentMode = resolvedTheme || 'light'
    }

    if (newColor === 'purple') {
      setTheme(currentMode)
    } else {
      setTheme(`${currentMode}-${newColor}`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon'>
          <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode} onValueChange={handleModeChange}>
          <DropdownMenuRadioItem value='light'>
            <Sun className='mr-2 h-4 w-4' />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='dark'>
            <Moon className='mr-2 h-4 w-4' />
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='system'>
            <Laptop className='mr-2 h-4 w-4' />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color</DropdownMenuLabel>
        <div className='grid grid-cols-4 gap-2 p-2'>
          {colors.map((c) => (
            <button
              key={c.name}
              className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                color === c.name ? 'ring-2 ring-ring ring-offset-2' : 'border-transparent'
              )}
              style={{ backgroundColor: c.color }}
              onClick={() => handleColorChange(c.name)}
            >
              {color === c.name && <Check className='h-4 w-4 text-white' />}
              <span className='sr-only'>{c.name}</span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}