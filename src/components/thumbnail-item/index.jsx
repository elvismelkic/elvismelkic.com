import React from 'react'
import { Link } from 'gatsby'
import { TARGET_CLASS } from '../../utils/visible'

import './index.scss'

export const ThumbnailItem = ({ node }) => {
  const outsideRouteTitle = 'How to build a self-healing system using supervision tree in Elixir'
  const route = node.frontmatter.title === outsideRouteTitle ? 'https://kodius.com/blog/elixir-supervision-tree' : node.fields.slug

  return (
    <Link className={`thumbnail ${TARGET_CLASS}`} to={route}>
      <div key={node.fields.slug}>
        <h3>{node.frontmatter.title || node.fields.slug}</h3>
        <p>{node.frontmatter.summary}</p>
      </div>
    </Link>
  )
}
