import React from 'react'
import { Link } from 'gatsby'
import { TARGET_CLASS } from '../../utils/visible'

import './index.scss'

export const ThumbnailItem = ({ node }) => {
  const outsideRouteTitle = 'How to build a self-healing system using supervision tree in Elixir'

  return (
    node.frontmatter.title === outsideRouteTitle
    ? <a className={`thumbnail ${TARGET_CLASS}`} href='https://kodius.com/blog/elixir-supervision-tree'>
      <div key={node.fields.slug}>
        <h3>{node.frontmatter.title || node.fields.slug}</h3>
        <p>{node.frontmatter.summary}</p>
      </div>
    </a>
    : <Link className={`thumbnail ${TARGET_CLASS}`} to={node.fields.slug}>
      <div key={node.fields.slug}>
        <h3>{node.frontmatter.title || node.fields.slug}</h3>
        <p>{node.frontmatter.summary}</p>
      </div>
    </Link>
  )
}
