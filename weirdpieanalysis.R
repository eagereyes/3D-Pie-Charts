library('ggplot2')
library('dplyr')

data <- read.csv('weirdpiesresults.csv')

# Filter out the two participants with more opposites
dataFiltered <- filter(data, resultID != '1481038244717x682752' & resultID != '1481037671383x544646')

#Only look at MTurk data for now
dataFiltered <- filter(dataFiltered, source == 'mturk')

dataFiltered <- mutate(dataFiltered,
			   error = answer-percentage,
			   absError = abs(error),
			   relError = absError/percentage,
			   duration = duration/1000,
			   variation = factor(variation, c('baseline', 'circular', 'floating-circle', 'circular-center', 'off-center', 'centered-square', 'centered-circle'))
			)

wrongSlice <- filter(dataFiltered, absError > abs(answer-(100-percentage)))
wrongSlice <- group_by(wrongSlice, resultID) %>% summarize(count = n())
wrongSlice <- wrongSlice[order(-wrongSlice$count),]
# Maximum of 13 wrong slices per participant is pretty low (15%)

wrongSlice <- filter(dataFiltered, absError > abs(answer-(100-percentage)))
wrongSlice <- group_by(wrongSlice, variation) %>% summarize(count = n())
wrongSlice <- wrongSlice[order(-wrongSlice$count),]
# Weird, this must be an effect of just error overall, not actually wrong slice
# variation count
# (fctr) (int)
# 1 centered-square   102
# 2 centered-circle    91
# 3      off-center    75
# 4 floating-circle    53
# 5        circular    36
# 6 circular-center    34
# 7        baseline    19

baseline <- dataFiltered %>%
	filter(variation == 'baseline') %>%
	group_by(resultID) %>%
	summarize(AbsErrorBaseline = mean(absError),
			  errorBaseline = mean(error),
			  relErrorBaseline = mean(relError),
			  durationBaseline = mean(duration)
			 )

dataFiltered <- dataFiltered %>%
	left_join(baseline, by = 'resultID') %>%
	mutate(normalizedAbsError = absError/AbsErrorBaseline,
		   normalizedError = error/errorBaseline,
		   normalizedRelError = relError/relErrorBaseline,
		   normalizedDuration = duration/durationBaseline
		   )

dataAggregated <- dataFiltered %>%
	group_by(resultID, variation) %>%
	summarize(meanError = mean(error), meanAbsError = mean(absError), meanRelError = mean(relError),
			  meanNormalizedError = mean(normalizedError), meanNormalizedAbsError = mean(normalizedAbsError), meanNormalizedRelError = mean(normalizedRelError),
			  meanDuration = mean(duration), normalizedMeanDuration = mean(normalizedDuration))

lowerCI <- function(v) {
	mean(v) - sd(v)*1.96/sqrt(length(v))
}

upperCI <- function(v) {
	mean(v) + sd(v)*1.96/sqrt(length(v))
}

# Absolute error CIs
ggplot(dataAggregated, aes(x=variation, y=meanAbsError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "Variation", y = "Absolute Error")

ggsave("/Users/rkosara/Dropbox (Personal)/Papers/2017/InfoVis – Part-Whole/img/weird-pies-absolute-error.pdf", width=6, height=4)


# Relative error CIs
ggplot(dataAggregated, aes(x=variation, y=meanRelError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "Variation", y = "Relative Error")

# Signed error CIs
ggplot(dataAggregated, aes(x=variation, y=meanError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	geom_hline(yintercept=0, linetype="dotted") +
	labs(x = "Variation", y = "Signed Error")

ggsave("/Users/rkosara/Dropbox (Personal)/Papers/2017/InfoVis – Part-Whole/img/weird-pies-signed-error.pdf", width=6, height=4)


# Normalized absolute error CIs
# Is there a point in doing this, though?
ggplot(dataAggregated, aes(x=variation, y=meanNormalizedAbsError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	geom_hline(yintercept=1, linetype="dotted") +
	labs(x = "Variation", y = "Absolute Error")

ggplot(dataFiltered, aes(percentage, answer-percentage, color=variation)) +
	geom_hline(yintercept=0, linetype="dotted") +
	geom_smooth() +
#	facet_grid(. ~ variation) +
	labs(x = "Percentage", y = "Signed Error")

ggplot(dataFiltered, aes(percentage, abs(answer-percentage), color=variation)) +
	geom_hline(yintercept=0, linetype="dotted") +
	geom_smooth() +
	#	facet_grid(. ~ variation) +
	labs(x = "Percentage", y = "Absolute Error")


# ANOVA for absolute error
summary(aov(meanAbsError ~ variation, dataAggregated))

# ANOVA for signed error
summary(aov(meanError ~ variation, dataAggregated))

# T-test to see if circular is different from baseline pie
with(dataAggregated, t.test(meanAbsError[variation == 'baseline'], meanAbsError[variation == 'circular'], paired=T))
with(dataAggregated, t.test(meanAbsError[variation == 'baseline'], meanAbsError[variation == 'circular'], paired=T, alternative = 'less'))

#
#
# Duration
ggplot(dataAggregated, aes(x=variation, y=meanDuration)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "Variation", y = "Response Time (s)")

durationBaseline <- group_by(dataFiltered, resultID) %>%
	summarize(durationByParticipant = mean(duration))

responseTime <- dataFiltered %>%
	left_join(durationBaseline, by = 'resultID') %>%
	mutate(normalizedDuration = duration/durationByParticipant
	)

rtAggregated <- responseTime %>%
	group_by(resultID, variation) %>%
	summarize(normalizedRT = mean(normalizedDuration))

ggplot(rtAggregated, aes(x=variation, y=normalizedRT)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "Variation", y = "Normalized Response Time")

ggsave("/Users/rkosara/Dropbox (Personal)/Papers/2017/InfoVis – Part-Whole/img/duration-variation.pdf", width=6, height=4)

# ANOVA of normalized durations
summary(aov(normalizedRT ~ variation, rtAggregated))

# t-test of baseline vs. circular slice chart
with(dataAggregated, t.test(meanDuration[variation == 'baseline'], meanDuration[variation == 'circular'], paired=T))

# t-test of baseline vs. circular slice chart, normalized data
with(rtAggregated, t.test(normalizedRT[variation == 'baseline'], normalizedRT[variation == 'circular'], paired=T))

# t-test of baseline vs. off-center pie, normalized duration
with(rtAggregated, t.test(normalizedRT[variation == 'baseline'], normalizedRT[variation == 'off-center'], paired=T))

# t-test of circular vs. off-center pie, normalized duration
with(rtAggregated, t.test(normalizedRT[variation == 'circular'], normalizedRT[variation == 'off-center'], paired=T))
with(rtAggregated, t.test(normalizedRT[variation == 'circular-center'], normalizedRT[variation == 'off-center'], paired=T))


ggplot(dataAggregated, aes(x=variation, y=normalizedMeanDuration)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "Variation", y = "Duration")

#
# Compare centered circle and bubble in the 0-25% range
#

# Floating bubble vs. centered bubble on all data
with(dataAggregated, t.test(meanAbsError[variation == 'centered-circle'], meanAbsError[variation == 'floating-circle'], paired=T))

dataSubset <- filter(dataFiltered, percentage <= 25) %>%
	group_by(resultID, variation) %>%
	summarize(meanError = mean(error), meanAbsError = mean(absError))

# circular slice through center vs. centered bubble
with(dataSubset, t.test(meanAbsError[variation == 'centered-circle'], meanAbsError[variation == 'circular-center'], paired=T))

mean(dataSubset$meanAbsError[dataSubset$variation == 'floating-circle'])
mean(dataSubset$meanAbsError[dataSubset$variation == 'centered-circle'])

# Bring in the arc data
arcs <- read.csv('weirdpie-arcs.csv')

# Filter down to just the variations that have arc percentages
# then join in the arc data
dataWithArcs <- data %>%
	filter(variation == 'baseline' | variation == 'circular' | variation == 'circular-center' | variation == 'off-center') %>%
	left_join(arcs, by = c('percentage', 'variation')) %>%
	mutate(arcError = answer-arcPercentage*100, absArcError = abs(arcError))

dataWithArcsAggregated <- dataWithArcs %>%
	group_by(resultID, variation) %>%
	summarize(meanError = mean(error), meanAbsError = mean(absError),
			  meanArcError = mean(arcError), meanAbsArcError = mean(absArcError))

