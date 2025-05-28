import React from "react"
import { Link } from "react-router-dom"
import { CATEGORIES } from "../constants/categories"

export default function CategoryList() {
  return (
    <div className="category-list">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.key}
          to={`/single/${cat.key}`}
          className={`btn category-btn text-wrap ${
            !cat.enabled ? "disabled" : ""
          }`}
          onClick={(e) => !cat.enabled && e.preventDefault()}
        >
          {cat.label}
        </Link>
      ))}
    </div>
  )
}
