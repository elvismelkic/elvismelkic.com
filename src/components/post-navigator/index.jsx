import React from 'react'
import { Link } from 'gatsby'

import './index.scss'

export const PostNavigator = ({ pageContext }) => {
  const { previous, next } = pageContext
  const outsideRouteTitle = 'How to build a self-healing system using supervision tree in Elixir'

  return (
    <ul className="navigator">
      <li>
        {previous && (
          previous.frontmatter.title === outsideRouteTitle
          ? <a href='https://kodius.com/blog/elixir-supervision-tree' rel="prev">
            ← {previous.frontmatter.title}
          </a>
          : <Link to={previous.fields.slug} rel="prev">
            ← {previous.frontmatter.title}
          </Link>
        )}
      </li>
      <li>
        {next && (
          next.frontmatter.title === outsideRouteTitle
          ? <a href='https://kodius.com/blog/elixir-supervision-tree' rel="next">
            ← {next.frontmatter.title}
          </a>
          : <Link to={next.fields.slug} rel="next">
            {next.frontmatter.title} →
          </Link>
        )}
      </li>
    </ul>
  )
}
