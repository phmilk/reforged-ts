-- Speaks the JSON contract without the runner.
function __reforged_test_run()
  return '{"tests":[{"name":"raw pass","status":"pass","suite":["raw"]},'
    .. '{"message":"raw \\"quoted\\" failure","name":"raw fail","status":"fail","suite":[]}]}'
end
