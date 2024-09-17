# These equations define a map from the cartesian coordinates (x,y) to (l1,l2)

MACHINE_DISTANCE = 235.0
def left_stepper(x,y)
  Math.sqrt(y**2 + x**2)
end

def right_stepper(x,y)
  Math.sqrt(y**2 + (MACHINE_DISTANCE - x)**2)
end

def coord_to_lengths(x,y)
  { left: left_stepper(x,y), right: right_stepper(x,y) }
end