interface HomeGreetingProps {
  firstName: string
  secondaryLine?: string
}

export function HomeGreeting({ firstName, secondaryLine }: HomeGreetingProps) {
  return (
    <div className="min-w-0 space-y-0.5">
      <h1 className="truncate font-display text-xl font-bold leading-tight tracking-tight lg:text-2xl">
        Olá, {firstName}
      </h1>
      {secondaryLine ? (
        <p className="truncate text-sm text-muted-foreground">{secondaryLine}</p>
      ) : null}
    </div>
  )
}
