-- reforged-test stubs for the effects family. Every call returns a new effect
-- handle, as the game allocates one per call.

function AddSpecialEffect(modelName, x, y)
  __stub_record("AddSpecialEffect", modelName, x, y)
  return __stub_new_handle("effect")
end

function AddSpecialEffectTarget(modelName, targetWidget, attachPointName)
  __stub_record("AddSpecialEffectTarget", modelName, targetWidget, attachPointName)
  return __stub_new_handle("effect")
end

function AddSpellEffectById(abilityId, t, x, y)
  __stub_record("AddSpellEffectById", abilityId, t, x, y)
  return __stub_new_handle("effect")
end

function AddSpellEffectTargetById(abilityId, t, targetWidget, attachPoint)
  __stub_record("AddSpellEffectTargetById", abilityId, t, targetWidget, attachPoint)
  return __stub_new_handle("effect")
end

-- A new effecttype handle per call; the EFFECT_TYPE_* constants are not
-- stubbed, so a test converts the value it needs.
function ConvertEffectType(i)
  __stub_record("ConvertEffectType", i)
  return __stub_new_handle("effecttype")
end
