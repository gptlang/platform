//
// Copyright © 2022 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import {
  type Class,
  type Doc,
  type DocIndexState,
  type DocumentQuery,
  type DocumentUpdate,
  type FullTextSearchContext,
  type Hierarchy,
  type MeasureContext,
  type ModelDb,
  type Ref
} from '@hcengineering/core'
import type { DbAdapter, IndexedDoc } from '@hcengineering/server-core'

/**
 * @public
 */
export interface FullTextPipeline {
  hierarchy: Hierarchy
  model: ModelDb

  contexts: Map<Ref<Class<Doc>>, FullTextSearchContext>

  propogage: Map<Ref<Class<Doc>>, Ref<Class<Doc>>[]>
  propogageClasses: Map<Ref<Class<Doc>>, Ref<Class<Doc>>[]>

  update: (
    docId: Ref<DocIndexState>,
    mark: boolean,
    update: DocumentUpdate<DocIndexState>,
    flush?: boolean
  ) => Promise<void>

  add: (doc: DocIndexState) => void
  markRemove: (doc: DocIndexState) => Promise<void>

  search: (
    _classes: Ref<Class<Doc>>[],
    search: DocumentQuery<Doc>,
    size: number | undefined,
    from?: number
  ) => Promise<{ docs: IndexedDoc[], pass: boolean }>

  queue: (
    ctx: MeasureContext,
    updates: Map<Ref<DocIndexState>, { create?: DocIndexState, updated: boolean, removed: boolean }>
  ) => Promise<void>

  cancelling: boolean
}

/**
 * @public
 */
export type DocUpdateHandler = (doc: DocIndexState, update: DocumentUpdate<DocIndexState>) => Promise<void>

/**
 * @public
 */
export interface FullTextPipelineStage {
  // States required to be complete
  require: string[]

  // State to be updated
  stageId: string

  // If specified, will clear all stages except specified + current
  clearExcept?: string[]

  // Will propagate some changes for both mark values.
  updateFields: DocUpdateHandler[]

  enabled: boolean
  initialize: (ctx: MeasureContext, storage: DbAdapter, pipeline: FullTextPipeline) => Promise<void>

  // Collect all changes related to bulk of document states
  collect: (docs: DocIndexState[], pipeline: FullTextPipeline, ctx: MeasureContext) => Promise<void>

  // Handle remove of items.
  remove: (docs: DocIndexState[], pipeline: FullTextPipeline) => Promise<void>

  // Search helper
  search: (
    _classes: Ref<Class<Doc>>[],
    search: DocumentQuery<Doc>,
    size: number | undefined,
    from?: number
  ) => Promise<{ docs: IndexedDoc[], pass: boolean }>
}

/**
 * @public
 */
export const contentStageId = 'cnt-v3'
/**
 * @public
 */
export const fieldStateId = 'fld-v15'

/**
 * @public
 */
export const fullTextPushStageId = 'fts-v17'

/**
 * @public
 */
export const summaryStageId = 'sum-v5'

/**
 * @public
 */
export const collabStageId = 'collab-v1'

/**
 * @public
 */
export const fullTextPushStagePrefix = 'fts-'