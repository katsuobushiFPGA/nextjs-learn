import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// このfunction内で`await`を使用する場合は、`async`でマークできます
export function proxy(request: NextRequest) {
  console.log("through proxy")
  return NextResponse.redirect(new URL('/home', request.url))
}

// 詳細については下の「パスのマッチング」を参照してください
export const config = {
  matcher: '/about/:path*',
}
