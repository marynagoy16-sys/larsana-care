// Stub vazio para react-native-maps no web
// O Metro resolve este arquivo em vez do react-native-maps real quando bundling para web
import React from 'react'
import { View } from 'react-native'

export default function MapView({ children, style }: any) {
  return React.createElement(View, { style }, children)
}

export function Marker() {
  return null
}

export function Callout() {
  return null
}

export function Polygon() {
  return null
}

export function Circle() {
  return null
}

export function Polyline() {
  return null
}
