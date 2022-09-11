import wmill

def main(name: str = "Don Quichotte"):
	print(f"Hello World and a warm welcome especially to {name}")
	print("The env variable at `g/all/pretty_secret`:", wmill.get_variable("g/all/pretty_secret"))
	return {"lenszsz": len(name), "splitted": name.split() }