import Export.Parse
import Lean

open Lean

#eval show CoreM _ from do
  let stream := IO.FS.Stream.ofHandle (← IO.FS.Handle.mk ((← IO.currentDir) / "output.ndjson") .read)
  let ex ← Export.Parse.M.run Export.Parse.parseFile stream
  logInfo m!"{ex.2.constMap.toArray.map (·.1)}"
  return ()
