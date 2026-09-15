import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/stylex/alert"

export default function Particle() {
  return (
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        <p>Describe what can be done about it here.</p>
      </AlertDescription>
    </Alert>
  )
}
