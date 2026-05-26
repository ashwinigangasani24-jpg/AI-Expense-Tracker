param(
  [Parameter(Mandatory = $true)]
  [string] $ApiUrl
)

$base = $ApiUrl.TrimEnd('/')
if (-not $base.EndsWith('/api')) {
  $base = "$base/api"
}

Write-Host "Setting VITE_API_URL=$base for production..."
$base | npx vercel env add VITE_API_URL production

Write-Host "Redeploying production..."
npx vercel --prod

Write-Host "Done. Open https://ai-expense-tracker-ten.vercel.app and try Register / Login."
